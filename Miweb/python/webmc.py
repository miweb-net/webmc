import subprocess
import shlex
import sys, os
from preferences import Preferences

import websocket_server
from logger import Log

log = Log()

def startChrome():

	url = 'html/mimc_web.html'
	# Path to chrome executable, plus all command line options
	# separated by commas. Split on the commas, then set the url per
	# OS-specific requirements.
	args = preferences.external.html.split(',')
	for file_index, arg in enumerate(args):
		if '<file>' in arg:
			break

	# If linux, use this path
	if sys.platform == 'linux':
		url = os.getcwd()[0:os.getcwd().rfind('/')+1] + url
	elif sys.platform == "win32":
		base_path = "///" + os.getcwd()[:os.getcwd().rfind('\\')+1]
		url = base_path.replace('\\', '/') + "/"  + url

	href = args[file_index].replace('<file>', url)
	args[file_index] = href
	log.info('Starting browser:', args)
	p = subprocess.Popen(args, stderr=subprocess.PIPE)
	return p.pid

def logVersionAndDate():

	with open('../html/mimc_web.html', 'r') as html:
		lines = html.readlines()

	version = 'Unknown'
	date = 'Unknown'
	for line in lines:
		if 'id="version_value"' in line:
			begin = line.rfind('">') + 2
			end = line.rfind('<')
			version = line[begin:end]
		elif 'id="version_date"' in line:
			begin = line.rfind('">') + 2
			end = line.rfind('<')
			date = line[begin:end]
			break

	log.info("Starting Media Center Version", version, "(" + date + ")")

def manageLogFileSize(max_size):

	# Simple log file rollover when > 50K bytes
	if os.path.exists(log.file):
		if os.stat(log.file).st_size > int(max_size):
			log.rotateLogFile()


if __name__ == '__main__':

	logVersionAndDate()
	preferences = Preferences()
	preferences.readConfig()

	manageLogFileSize(preferences.log.max_size)

	# Start the chrome browser in the background.
	browser_pid = startChrome()
	#print("BROWSER:", browser_pid)
	websocket_server.browser_pid = browser_pid
	#print("'startChrome' is commented out for testing purposes")

	# Start the websocket server (host)
	websocket_server.startServer()

	log.info("Main Exit")
	sys.exit()
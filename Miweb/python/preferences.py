# The preferences module manages the configuration and preferences
# for the entire program. They are sent via message to the browser
# where applicable.

from pathlib import Path
import os, sys
from logger import Log

try:
	if log == None:
		print('Not sure why')
except:
	log = Log()

class Preferences():

	def __init__(self):

		self.file = "../webmc.cfg"


		self.language = Language()
		self.database = Hymnbook()
		self.presentation = Presentation()
		self.theme = Theme()
		self.log = Logger()
		self.splash = Splash()
		self.bible = Bible()
		self.hymn = Hymn()
		self.ccli = Ccli()
		self.external = External()
		self.importer = Importer()


	def readConfig(self):

		try:
			with open(self.file, 'r') as cfg:
				lines = cfg.read()

			for line in lines.split('\n'):
				if len(line) == 0:
					continue
				elif line.startswith("#"):
					continue
				elif line.startswith("["):
					section = line[1:-1].lower()
					if hasattr(self, section):
						subclass = getattr(self, section)
					else:
						log.error('Configuration file error. Unrecognized class:[' + section.upper() + ']')
				else:
					# Don't use split('=') because some values use '=' too.
					equal = line.find('=')
					key = line[:equal]
					value = line[equal+1:]
					#key,fvalue = line.split('=')
					value = self.convertValue(value)
					if value.lower() == "false":
						value = False
					elif value.lower() == "true":
						value = True
					if hasattr(subclass, key):
						# Check for list type
						if type(getattr(subclass, key)) == type([]):
							# Get list object and append to it.
							alist = getattr(subclass, key)
							alist.append(value)
						else:
							# Scalar. Just create value.
							setattr(subclass, key, value)
						setattr(self, str(subclass).lower(), subclass)
					else:
						# Scalar. Just create value of dictionary key
						log.warning("Configuration... Unrecognized Key:" + key + " in class [" + section.upper() + "] with Value:", value)
		except:
			raise

	# Create and return a dict comprising all preference subclasses
	def getDict(self):
		all_prefs = {}
		# Get a dictionary of all preferences class variables
		for var in self.__dict__.keys():
			# If the variable is a class...
			instance = getattr(self, var)
			if str(type(instance)).lower().count(var) > 0:
				# This is a subclass. Add to dictionary
				all_prefs[var] = instance.__dict__

		return all_prefs

	# Replace tags within strings from the config file with env-specific
	# values for this installation
	def convertValue(self, value):

		newvalue = value
		if "<HOME>" in value:
			newvalue = value.replace("<HOME>", str(Path.home()))
		elif value.startswith("../"):
			pwd = os.getcwd()
			if sys.platform == "linux":
				slash = pwd.rfind("/")
				newvalue = pwd[:slash] + value[2:]
			elif sys.platform == "win32":
				slash = pwd.rfind("\\")
				#newvalue = pwd[:slash].replace('\\', '/') + value[2:]

		return newvalue


class Language(Preferences):
	def __init__(self):
		self.name = []
		self.default = ""

class Hymnbook(Preferences):
	def __init__(self):
		self.path = []
		self.default = ""

class Theme(Preferences):
	def __init__(self):
		self.path = ""
		self.default = ""

class Logger(Preferences):
	def __init__(self):
		self.max_size = 50000

class Splash(Preferences):
	def __init__(self):
		self.label1 = "Mountain Island"
		self.label2 = "Media Center"

class Bible(Preferences):
	def __init__(self):
		self.sword_path = 'C:/Program Files (x86)/e-Sword'
		self.version = 'KJV'
		self.clean = False
		self.font_sz = 35

class Hymn(Preferences):
	def __init__(self):
		self.clean = True

class Presentation(Preferences):
	def __init__(self):
		self.clean = False 
		self.path = 'C:/Miweb/presentations'
		self.ratio = []
		self.default = ""

class External(Preferences):
	def __init__(self):
		self.midi = 'C:/Program Files/VideoLAN/VLC/vlc.exe,<file>'
		self.mp3 = 'C:/Program Files/VideoLAN/VLC/vlc.exe,<file>'
		self.web = 'google-chrome-stable,<link>'
		self.html = 'google-chrome-stable,--content-shell-hide-toolbar,--new-window,--app=file:<file>'
		self.pptx = 'C:/Program Files/LibreOffice/program/simpress.exe,--impress,--show,<file>'
		self.bible = 'C:/diatheke-4.0-win32/diatheke.exe,-b,<version>,-f,plain,-k,<passage>'
		self.browse_folder = 'cscript,C:/Miweb/windows/zenity.vbs,C:/Miweb'

class Ccli(Preferences):
	def __init__(self):
		self.number = '0123456'
		self.expiration = '12/21/2020'

class Importer(Preferences):
	def __init__(self):
		self.path = ''


if __name__ == '__main__':
	p = Preferences()
	p.readConfig()
	print(p.presentation)
	print(p.getDict())


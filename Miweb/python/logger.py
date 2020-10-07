import datetime
import os

class Log():

	def __init__(self, file="../webmc.log"):

		self.file = file
		self.type_length = 9
		self.lf = '\n                             '


	def rotateLogFile(self):
		# Get the basename of the file
		self.info("Log file size:", os.stat(self.file).st_size, "End of File!")

		dot = self.file.rfind('.')
		basename = self.file[:dot]
		extension = self.file[dot:]

		version5 = basename + '5' + extension

		if os.path.exists(version5):
			os.remove(version5)

		for i in range(4, 0, -1):	# Support 5 backups
			fname = basename + str(i) + extension
			if os.path.exists(fname):
				os.rename(fname, basename + str(i + 1) + extension)

		# And rename the basename to '...1.log'
		version1 = basename + '1' + extension
		os.rename(self.file, version1)


	# Method for creating a logging time stamp.
	def getTimeStamp(self):
		now = datetime.datetime.now()
		format_date = str(now.month).zfill(2) + '/' + str(now.day).zfill(2) + '/' + str(now.year)[-2:]
		format_time = str(now.hour).zfill(2) + ':' + str(now.minute).zfill(2) + ':' + str(now.second).zfill(2)
		return format_date + " " + format_time

	# This is where the work is done. All other log.<type> methods call log
	def log(self, message):
		out = self.getTimeStamp()
		out += '> ' + message.replace('\n', self.lf) + '\n'
		with open(self.file, 'a') as outfile:
			outfile.write(out)

	def error(self, *args):
		elements = [str(x) for x in args]
		out = 'Error:'.ljust(self.type_length) + ' '.join(elements)
		self.log(out)

	def warning(self, *args):
		elements = [str(x) for x in args]
		out = 'Warning:'.ljust(self.type_length) + ' '.join(elements)
		self.log(out)

	def info(self, *args):
		elements = [str(x) for x in args]
		out = 'Info:'.ljust(self.type_length) + ' '.join(elements)
		self.log(out)

	def config(self, *args):
		elements = [str(x) for x in args]
		out = 'Config:'.ljust(self.type_length) + ' '.join(elements)
		self.log(out)

	def debug(self, *args):
		elements = [str(x) for x in args]
		out = 'Debug:'.ljust(self.type_length) + ' '.join(elements)
		self.log(out)

if __name__ == '__main__':
	
	log = Log()
	log.error("I have", "something", "to" , "say now!")
	log.warning("This", 'had better', 'be', 'goodly')
	log.info('For your information')
	log.config('Setting variable foo =', 10)
	

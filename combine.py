import os, sys, glob
import websockets # This is only to test python install worked.


def combine(file_prefix, file_out):
	''' The combine function concatenates 2 files using binary mode.
	    The combined files will be checked against the file_prefix pattern.
	    A file_prefix = 'myfile.zip' would copy bytes from myfile.zip.00
	    to file_out, then it would append bytes from myfile.zip.01, and
	    so on, until a break in the sequence is detected (e.g. no myfile.zip.nm).
	'''

	if not os.path.exists(file_prefix + '.00'):
		print("Error: File", file_prefix + '.00 does not exist.')
		usage()
		sys.exit(1)

	file_list = glob.glob(file_prefix + '.*')
	file_list.sort()
	with open(file_out, 'wb') as outfile:
		for file in file_list:
			suffix = file[file.rfind('.') + 1:]
			# Make sure the suffix is an integer
			try:
				isuffix = int(suffix)
				with open(file, 'rb') as source:
					data = source.read()
					outfile.write(data)
			except:
				break	# Not an integer suffix - exit.




def usage():
	print('Usage:')
	print('python3 combine.py infile_prefix outfile_path')
	print('\twhere:')
	print('\t\tinfile_prefix is a full or partial path to a sequence of split files')
	print('\t\toutfile_path is the single output (combined file) path.')
	print('\t\tFor example:\n')
	print('\t\t\tpython combine.py myfile.zip newfile.zip\n')
	print('\t\twould create newfile.zip from myfile.zip.00, myfile.zip.01...')

if __name__ == '__main__':

	if len(sys.argv) == 2 and sys.argv[1] == 'test':
		print('combine.py test mode')
		sys.exit(0)
	if len(sys.argv) != 3:
		usage()
		sys.exit(-1)

	combine(sys.argv[1], sys.argv[2])
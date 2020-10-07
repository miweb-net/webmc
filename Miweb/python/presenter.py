import os, sys
from slide import Slide
from pptx import Presentation
from logger import Log

log = Log()

class Presenter():

	def __init__(self):
		x = 10	# Nothing yet to initialize?

		
	def createScriptureFile(self, path, font_sz, ref, text, meta, ratio):
		slide = Slide(meta, ratio)
		# Multiple-paged scriptures are delimited by "¶"
		pg_num = 0
		pages = text.split('¶')
		for page in pages:
			# There are \n chars at beginning of pages.
			# Strip it, except first page.
			if pg_num:
				page = page.lstrip("\n")
			slide.addTextSlide(slide, page, font_sz)
			#if pg_num == 0 and len(pages) > 1:
			#	slide.addHiddenMetaRecord(slide, meta)
			pg_num += 1

		slide.addScriptureTextReference(slide, ref)
		#if len(pages) == 1:
		#	slide.addHiddenMetaRecord(slide, meta)
		slide.addBlackSlide()
		slide.saveFile(path)
		log.info("Presenter created scripture:", path)

	# Creates a song presentation file from a song dictionary and paths list.
	# The meta is a dict containing things like CLI num, ratio, config stuff.
	def createSongFile(self, pres_path, song, paths, prefs, ratio):

		slide = Slide(prefs, ratio)

		i = 0
		# Is this a medley? If so, we will create a Medley page to include all
		# meta-data for represented hymns.
		if song['type'] == 'medley':
			slide.addMedleySlide(song)

		# Iterate through the PAGE_SEQUENCE to maintain page order
		for path in paths:
			if i == 0:
				if song['type'] == 'medley':
					medley_meta = song.copy()
					# This next line works as long as numbers are STRINGS
					song['number'] = ', '.join(song['number'])
					slide.addHiddenMetaRecord(slide.slide, medley_meta)
					slide.addMusicSlide(path, song, 0)
				else:
					slide.addMusicSlide(path, song, 1) 

			else:
				slide.addMusicSlide(path, song, 0)
			i += 1

		slide.addBlackSlide()
		slide.saveFile(pres_path)
		log.info("Presenter created", song['type'] + ':', pres_path)
		return True


if __name__ == '__main__':
	#freeze_support()
	app = Presenter()
	


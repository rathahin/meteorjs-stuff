PDF =
  process: (pdfFile, initCallback, textCallback, pageImageCallback, progressCallback) ->
    fs = Npm.require 'fs'

    DEBUG = false
    NOT_WHITESPACE = /\S/

    processPDF = (finalCallback) -> (pdf) ->
      initCallback pdf.numPages

      counter = pdf.numPages
      terminate = false

      pageError = (pageNumber) -> (err) ->
        error = new Error "PDF page #{ pageNumber } rendering error: #{ err.message or err }"
        _.extend error, _.omit err, 'message' if _.isObject err
        terminate = true
        throw error

      processPage = (page) ->
        return if terminate

        # pageNumber is not necessary current page number once promise is resolved, use page.pageNumber instead
        progressCallback (page.pageNumber - 1) / pdf.numPages

        #page.getAnnotations().then (annotations) ->
          #console.log "Annotations", annotations

        processText = (textContent) ->
          appendCounter = 0
          textLayer =
            beginLayout: ->
              return if terminate

              #console.log "beginLayout"

            endLayout: ->
              return if terminate

              #console.log "endLayout"

              if DEBUG
                # Save the canvas (with rectangles around text segments)
                png = fs.createWriteStream 'debug' + page.pageNumber + '.png'
                canvasElement.pngStream().pipe png

              pageImageCallback page.pageNumber, canvasElement

              # We call finalCallback only after all pages have been processed and thus callbacks called
              counter--
              if counter == 0
                progressCallback 1.0
                finalCallback()

            appendText: (geom) ->
              return if terminate

              width = geom.canvasWidth * geom.hScale
              height = geom.fontSize * Math.abs geom.vScale
              x = geom.x
              y = viewport.height - geom.y
              text = textContent.bidiTexts[appendCounter].str
              direction = textContent.bidiTexts[appendCounter].dir

              if direction == 'ttb' # Vertical text
                # We rotate for 90 degrees
                # Example: http://blogs.adobe.com/CCJKType/files/2012/07/TaroUTR50SortedList112.pdf
                x -= height
                y -= width - height
                [height, width] = [width, height]

              appendCounter++

              if !NOT_WHITESPACE.test text
                return

              if DEBUG
                # Draw a rectangle around the text segment
                canvasContext.strokeRect x, y, width, height

              # TODO: Store into the database
              # TODO: We should just allow user to provide a callback
              #console.log page.pageNumber, x, y, width, height, direction, text

              textCallback page.pageNumber, x, y, width, height, direction, text

          viewport = page.getViewport 1.0
          canvasElement = new PDFJS.canvas viewport.width, viewport.height
          canvasContext = canvasElement.getContext '2d'

          renderContext =
            canvasContext: canvasContext
            viewport: viewport
            textLayer: textLayer

          page.render(renderContext).then ->
            return # Do nothing
          , pageError page.pageNumber

        page.getTextContent().then processText, pageError page.pageNumber

      for pageNumber in [1..pdf.numPages]
        pdf.getPage(pageNumber).then processPage, pageError pageNumber

        #pdf.getMetadata(pageNumber).then (metadata) ->
          # TODO: If we will process metadata, too, we have to make sure finalCallback is called after only once after everything is finished
          #console.log "Metadata", metadata

      return # So that we do not return the results of the for-loop

    processError = (finalCallback) -> (message, exception) ->
      error = new Error "PDF processing error: #{ message or exception?.message or exception }"
      _.extend error, _.omit exception, 'message' if _.isObject exception
      throw error

    # "finalCallback" has to be called only once to unblock
    processAll = blocking (finalCallback) ->
      PDFJS.getDocument({data: pdfFile, password: ''}).then processPDF(finalCallback), processError(finalCallback)

    processAll()

    return # So that we do not return any results

@PDF = PDF

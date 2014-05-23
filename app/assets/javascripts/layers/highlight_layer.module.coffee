Layer = require('layer')

class HighlightLayer extends Layer

  add: (coordinate, color) ->
    attrs =
      board: @board
      coordinate: coordinate
      display_type: 'highlight'
      display_option: color
      layer: @

    space = new @board.space_constructor(attrs)
    @element.add(space.element)
    @coordinate_map.set(space.coordinate, space)

module.exports = HighlightLayer
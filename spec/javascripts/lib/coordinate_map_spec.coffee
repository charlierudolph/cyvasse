CoordinateMap = require("lib/coordinate_map")

describe 'CoordinateMap', ->
  beforeEach ->
    @data = {a:1,b:2,c:3}
    @coordinate = {x:0,y:0}
    @coordinate_map = new CoordinateMap

  context '#set and #get', ->
    it 'works', ->
      @coordinate_map.set(@coordinate, @data)
      expect(@coordinate_map.get(@coordinate)).to.eql @data

  context '#values', ->
    it 'returns an array of values', ->
      @coordinate_map.set(@coordinate, @data)
      expect(@coordinate_map.values()).to.eql [@data]

  context 'remove', ->
    it 'works', ->
      @coordinate_map.set(@coordinate, @data)
      @coordinate_map.remove(@coordinate)
      expect(@coordinate_map.get(@coordinate)).to.eql undefined

  context 'clear', ->
    it 'removes all data', ->
      @coordinate_map.set(@coordinate, @data)
      @coordinate_map.clear()
      expect(@coordinate_map.get(@coordinate)).to.eql undefined

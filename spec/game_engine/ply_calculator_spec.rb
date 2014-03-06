require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_data.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'
require ROOT_DIRECTORY + '/app/game_storage/terrain.rb'
require ROOT_DIRECTORY + '/lib/coordinate_distance.rb'

describe PlyCalculator do
  let(:ply_calculator) { PlyCalculator.new(board, coordinate_map) }
  let(:coordinate_map) { double :coordinate_map, get: nil }
  let(:piece) { double :piece, coordinate: coordinate, user_id: user1_id, type_id: 1, rule: piece_rule }
  let(:user1_id) { 1 }
  let(:user2_id) { 2 }
  let(:piece_rule) { double :piece_rule, piece_rule_parameters.merge(capture_type: capture_type) }
  let(:capture_type) { 'movement' }

  before { coordinate_map.stub(:get).with(coordinate, Piece).and_return(piece) }

  context 'movement' do
    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(4) }
      let(:coordinate) { {'x'=>0, 'y'=>0, 'z'=>0}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>1, "y"=>0, "z"=>0}, {"x"=>2, "y"=>0, "z"=>0}, {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>-2, "z"=>0}, {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>0, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>-2}, {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>1, "y"=>1, "z"=>0},
            {"x"=>-1, "y"=>-1, "z"=>0},
            {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>1, "z"=>1},
            {"x"=>0, "y"=>-1, "z"=>-1}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>2, "y"=>0, "z"=>0}, {"x"=>1, "y"=>1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-2, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>-2}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end
    end

    context 'square_board' do
      let(:board) { SquareBoard.new(5,5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>2}, {"x"=>4, "y"=>2},
            {"x"=>1, "y"=>2}, {"x"=>0, "y"=>2},
            {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4},
            {"x"=>2, "y"=>1}, {"x"=>2, "y"=>0}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>3}, {"x"=>4, "y"=>4},
            {"x"=>3, "y"=>1}, {"x"=>4, "y"=>0},
            {"x"=>1, "y"=>3}, {"x"=>0, "y"=>4},
            {"x"=>1, "y"=>1}, {"x"=>0, "y"=>0}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>4, "y"=>2}, {"x"=>3, "y"=>3},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>3},
            {"x"=>0, "y"=>2}, {"x"=>1, "y"=>1},
            {"x"=>2, "y"=>0}, {"x"=>3, "y"=>1},
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>0, "y"=>0}, {"x"=>2, "y"=>0},
            {"x"=>4, "y"=>0}, {"x"=>4, "y"=>2},
            {"x"=>4, "y"=>4}, {"x"=>2, "y"=>4},
            {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2},
          ]
        end
      end
    end

    context 'board agnostic' do
      let(:board) { SquareBoard.new(5, 5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

      context 'other pieces' do
        let(:ally_piece_coordinate) { {'x'=>2, 'y'=>0} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }
        let(:enemy_piece_coordinate) { {'x'=>1, 'y'=>2} }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        context 'capture_type == movement' do
          let(:capture_type) { 'movement' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'capture_type == range' do
          let(:capture_type) { 'range' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end

      context 'terrain' do
        let(:ally_terrain_coordinate) { {'x'=>2, 'y'=>0} }
        let(:ally_terrain) { double :terrain, coordinate: ally_terrain_coordinate, user_id: user1_id, rule: terrain_rule }
        let(:enemy_terrain_coordinate) { {'x'=>1, 'y'=>2} }
        let(:enemy_terrain) { double :terrain, coordinate: enemy_terrain_coordinate, user_id: user2_id, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule }

        before do
          coordinate_map.stub(:get).with(ally_terrain_coordinate, Terrain).and_return(ally_terrain)
          coordinate_map.stub(:get).with(enemy_terrain_coordinate, Terrain).and_return(enemy_terrain)
        end

        context 'blocking' do
          before { terrain_rule.stub(:block?).with('movement', 1).and_return(true) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'not blocking' do
          before { terrain_rule.stub(:block?).with('movement', 1).and_return(false) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>0, 'y'=>2}, {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>0}, {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end
    end
  end

  context 'range' do
    let(:capture_type) { 'range' }

    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(4) }
      let(:coordinate) { {'x'=>0, 'y'=>0, 'z'=>0}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>1, "y"=>0, "z"=>0}, {"x"=>2, "y"=>0, "z"=>0}, {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>-2, "z"=>0}, {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>0, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>-2}, {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>1, "y"=>1, "z"=>0},
            {"x"=>-1, "y"=>-1, "z"=>0},
            {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>1, "z"=>1},
            {"x"=>0, "y"=>-1, "z"=>-1}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>2, "y"=>0, "z"=>0}, {"x"=>1, "y"=>1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-2, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>-2}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end
    end

    context "square_board" do
      let(:board) { SquareBoard.new(5,5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>2}, {"x"=>4, "y"=>2},
            {"x"=>1, "y"=>2}, {"x"=>0, "y"=>2},
            {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4},
            {"x"=>2, "y"=>1}, {"x"=>2, "y"=>0}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>3}, {"x"=>4, "y"=>4},
            {"x"=>3, "y"=>1}, {"x"=>4, "y"=>0},
            {"x"=>1, "y"=>3}, {"x"=>0, "y"=>4},
            {"x"=>1, "y"=>1}, {"x"=>0, "y"=>0}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>4, "y"=>2}, {"x"=>3, "y"=>3},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>3},
            {"x"=>0, "y"=>2}, {"x"=>1, "y"=>1},
            {"x"=>2, "y"=>0}, {"x"=>3, "y"=>1},
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>0, "y"=>0}, {"x"=>2, "y"=>0},
            {"x"=>4, "y"=>0}, {"x"=>4, "y"=>2},
            {"x"=>4, "y"=>4}, {"x"=>2, "y"=>4},
            {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2},
          ]
        end
      end
    end

    context 'board agnostic' do
      let(:board) { SquareBoard.new(5, 5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }
      let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

      context 'other pieces' do
        let(:ally_piece_coordinate) { {'x'=>2, 'y'=>0} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }
        let(:enemy_piece_coordinate) { {'x'=>1, 'y'=>2} }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
            {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
          ]
        end
      end

      context 'terrain' do
        let(:ally_terrain_coordinate) { {'x'=>2, 'y'=>0} }
        let(:ally_terrain) { double :terrain, coordinate: ally_terrain_coordinate, user_id: user1_id, rule: terrain_rule }
        let(:enemy_terrain_coordinate) { {'x'=>1, 'y'=>2} }
        let(:enemy_terrain) { double :terrain, coordinate: enemy_terrain_coordinate, user_id: user2_id, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule }

        before do
          coordinate_map.stub(:get).with(ally_terrain_coordinate, Terrain).and_return(ally_terrain)
          coordinate_map.stub(:get).with(enemy_terrain_coordinate, Terrain).and_return(enemy_terrain)
        end

        context 'blocking' do
          before { terrain_rule.stub(:block?).with('range', 1).and_return(true) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'not blocking' do
          before { terrain_rule.stub(:block?).with('range', 1).and_return(false) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>0, 'y'=>2}, {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>0}, {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end
    end
  end
end
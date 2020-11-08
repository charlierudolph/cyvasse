import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../../shared/utilities/value_checker";
import { IGameSetupChange, PlayerColor } from "../../../shared/dtos/game";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/piece_rule";
import { ICyvasseBoard } from "../game/board/cyvasse_board";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";

export interface IValidateGameSetupChangeOptions {
  board: ICyvasseBoard;
  change: IGameSetupChange;
  coordinateMap: CyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  playerColor: PlayerColor;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
}

export function validateGameSetupChange(
  options: IValidateGameSetupChangeOptions
): string {
  const { pieceChange, terrainChange } = options.change;
  if (
    (doesNotHaveValue(pieceChange) && doesNotHaveValue(terrainChange)) ||
    (doesHaveValue(pieceChange) && doesHaveValue(terrainChange))
  ) {
    return "Must have exactly one piece change or terrain change";
  }
  if (doesHaveValue(pieceChange)) {
    if (
      doesNotHaveValue(pieceChange.from) &&
      doesNotHaveValue(pieceChange.to)
    ) {
      return "Piece change - must have either from or to";
    }
    if (doesNotHaveValue(pieceChange.pieceTypeId)) {
      return "Piece change - must have piece type";
    }
    if (
      doesHaveValue(pieceChange.from) &&
      options.board.getSetupTerritoryOwner(pieceChange.from) !==
        options.playerColor
    ) {
      return "Piece change - from coordinate is not in setup territory";
    }
    if (
      doesHaveValue(pieceChange.to) &&
      options.board.getSetupTerritoryOwner(pieceChange.to) !==
        options.playerColor
    ) {
      return "Piece change - to coordinate is not in setup territory";
    }
    if (doesHaveValue(pieceChange.from)) {
      const existingPiece = options.coordinateMap.getPiece(pieceChange.from);
      if (
        doesNotHaveValue(existingPiece) ||
        existingPiece.pieceTypeId !== pieceChange.pieceTypeId
      ) {
        return "Piece change - from coordinate does contain piece type";
      }
    }
    if (doesHaveValue(pieceChange.to)) {
      const existingPiece = options.coordinateMap.getPiece(pieceChange.to);
      if (doesHaveValue(existingPiece)) {
        return "Piece change - to coordinate is not free";
      }
    }
    if (doesNotHaveValue(pieceChange.from)) {
      if (!options.pieceRuleMap.has(pieceChange.pieceTypeId)) {
        return "Piece change - piece type not allowed";
      }
      const maxPieceTypeCount = options.pieceRuleMap.get(
        pieceChange.pieceTypeId
      ).count;
      const currentPieceTypeCount = options.coordinateMap
        .serialize()
        .filter((x) => x.value.piece?.pieceTypeId === pieceChange.pieceTypeId)
        .length;
      if (currentPieceTypeCount === maxPieceTypeCount) {
        return "Piece change - already at max count for piece type";
      }
    }
  }
  if (doesHaveValue(terrainChange)) {
    if (
      doesNotHaveValue(terrainChange.from) &&
      doesNotHaveValue(terrainChange.to)
    ) {
      return "Terrain change - must have either from or to";
    }
    if (doesNotHaveValue(terrainChange.terrainTypeId)) {
      return "Terrain change - must have piece type";
    }
    if (
      doesHaveValue(terrainChange.from) &&
      options.board.getSetupTerritoryOwner(terrainChange.from) !==
        options.playerColor
    ) {
      return "Terrain change - from coordinate is not in setup territory";
    }
    if (
      doesHaveValue(terrainChange.to) &&
      options.board.getSetupTerritoryOwner(terrainChange.to) !==
        options.playerColor
    ) {
      return "Terrain change - to coordinate is not in setup territory";
    }
    if (doesHaveValue(terrainChange.from)) {
      const existingTerrain = options.coordinateMap.getTerrain(
        terrainChange.from
      );
      if (
        doesNotHaveValue(existingTerrain) ||
        existingTerrain.terrainTypeId !== terrainChange.terrainTypeId
      ) {
        return "Terrain change - from coordinate does contain terrain type";
      }
    }
    if (doesHaveValue(terrainChange.to)) {
      const existingTerrain = options.coordinateMap.getTerrain(
        terrainChange.to
      );
      if (doesHaveValue(existingTerrain)) {
        return "Terrain change - to coordinate is not free";
      }
    }
    if (doesNotHaveValue(terrainChange.from)) {
      if (!options.terrainRuleMap.has(terrainChange.terrainTypeId)) {
        return "Terrain change - terrain type not allowed";
      }
      const maxTerrainTypeCount = options.terrainRuleMap.get(
        terrainChange.terrainTypeId
      ).count;
      const currentTerrainTypeCount = options.coordinateMap
        .serialize()
        .filter(
          (x) => x.value.terrain?.terrainTypeId === terrainChange.terrainTypeId
        ).length;
      if (currentTerrainTypeCount === maxTerrainTypeCount) {
        return "Terrain change - already at max count for terrain type";
      }
    }
  }
  return null;
}
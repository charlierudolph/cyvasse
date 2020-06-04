import {
  IVariantOptions,
  IVariant,
  ISearchVariantsRequest,
} from "../shared/dtos/variant";
import { doesHaveValue } from "../shared/utilities/value_checker";
import {
  IVariantDataService,
  VariantDataService,
} from "./data/variant_data_service";
import { validateVariantOptions } from "./validators/variant_validator";
import { IPaginatedResponse } from "../shared/dtos/search";
import {
  throwVariantNotFoundError,
  throwVariantAuthorizationError,
  ValidationError,
} from "./exceptions";
import {
  PlayerColor,
  IPreviewPieceRuleRequest,
  IPreviewPieceRuleResponse,
} from "../shared/dtos/game";
import { getBoardForVariant } from "./game/board/builder";
import { CoordinateMap } from "./game/storage/coordinate_map";
import { previewPieceRule } from "./game/ply_calculator/preview";
import {
  IPieceRuleDataService,
  PieceRuleDataService,
} from "./data/piece_rule_data_service";
import {
  IPieceRuleOptions,
  PieceType,
  PathType,
  CaptureType,
} from "../shared/dtos/piece_rule";

export interface IVariantService {
  createVariant: (
    userId: number,
    options: IVariantOptions
  ) => Promise<IVariant>;
  getVariant: (variantId: number) => Promise<IVariant>;
  deleteVariant: (userId: number, variantId: number) => Promise<void>;
  previewPieceRule: (
    variantId: number,
    request: IPreviewPieceRuleRequest
  ) => Promise<IPreviewPieceRuleResponse>;
  searchVariants: (
    request: ISearchVariantsRequest
  ) => Promise<IPaginatedResponse<IVariant>>;
  updateVariant: (
    userId: number,
    variantId: number,
    options: IVariantOptions
  ) => Promise<IVariant>;
}

export class VariantService implements IVariantService {
  constructor(
    private readonly pieceRuleDataService: IPieceRuleDataService = new PieceRuleDataService(),
    private readonly variantDataService: IVariantDataService = new VariantDataService()
  ) {}

  async createVariant(
    userId: number,
    options: IVariantOptions
  ): Promise<IVariant> {
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      throw new ValidationError(validationErrors);
    }
    const variant = await this.variantDataService.createVariant(
      options,
      userId
    );
    const kingPieceRuleOptions: IPieceRuleOptions = {
      pieceTypeId: PieceType.KING,
      count: 1,
      movement: {
        type: PathType.DIAGONAL_LINE,
        minimum: 1,
        maximum: 1,
      },
      captureType: CaptureType.MOVEMENT,
    };
    await this.pieceRuleDataService.createPieceRule(
      kingPieceRuleOptions,
      variant.variantId
    );
    return variant;
  }

  async searchVariants(
    request: ISearchVariantsRequest
  ): Promise<IPaginatedResponse<IVariant>> {
    // TODO validate request
    return await this.variantDataService.searchVariants(request);
  }

  async getVariant(variantId: number): Promise<IVariant> {
    if (!(await this.variantDataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    return await this.variantDataService.getVariant(variantId);
  }

  async deleteVariant(userId: number, variantId: number): Promise<void> {
    if (!(await this.variantDataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("delete the variant");
    }
    await this.variantDataService.deleteVariant(variantId);
  }

  async previewPieceRule(
    variantId: number,
    request: IPreviewPieceRuleRequest
  ): Promise<IPreviewPieceRuleResponse> {
    if (!(await this.variantDataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    const board = getBoardForVariant(variant);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    const coordinate = board.getCenter();
    coordinateMap.addPiece(coordinate, {
      pieceTypeId: request.pieceRule.pieceTypeId,
      playerColor: PlayerColor.ALABASTER,
    });
    return previewPieceRule({
      evaluationType: request.evaluationType,
      pieceRule: request.pieceRule,
      variant,
    });
  }

  async updateVariant(
    userId: number,
    variantId: number,
    options: IVariantOptions
  ): Promise<IVariant> {
    if (!(await this.variantDataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("update the variant");
    }
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      throw new ValidationError(validationErrors);
    }
    return await this.variantDataService.updateVariant(variantId, options);
  }
}

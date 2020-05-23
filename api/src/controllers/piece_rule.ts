import express from "express";
import { IUser } from "../shared/dtos/authentication";
import { PieceRuleService } from "../services/piece_rule_service";

// Assumes parentRouter has variantId in params
export function getPieceRulesRouter(
  authenticationRequired: express.Handler,
  pieceRuleService: PieceRuleService = new PieceRuleService()
): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", function (req, res, next) {
    pieceRuleService
      .getPieceRules(parseInt(req.params.variantId))
      .then((pieceRules) => {
        res.status(200).send(pieceRules);
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function (req, res, next) {
    pieceRuleService
      .createPieceRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        req.body
      )
      .then((pieceRule) => {
        res.status(200).send(pieceRule);
      })
      .catch(next);
  });
  router.put("/:pieceRuleId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    pieceRuleService
      .updatePieceRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        parseInt(req.params.pieceRuleId),
        req.body
      )
      .then((pieceRule) => {
        res.status(200).send(pieceRule);
      })
      .catch(next);
  });
  router.delete("/:pieceRuleId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    pieceRuleService
      .deletePieceRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        parseInt(req.params.pieceRuleId)
      )
      .then(() => res.status(200).end())
      .catch(next);
  });
  return router;
}

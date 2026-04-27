import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metadataRouter from "./metadata";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metadataRouter);

export default router;

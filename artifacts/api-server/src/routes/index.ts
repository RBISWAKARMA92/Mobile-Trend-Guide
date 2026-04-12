import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import authRouter from "./auth";
import subscriptionRouter from "./subscription";
import creditsRouter from "./credits";
import activityRouter from "./activity";
import spotifyRouter from "./spotify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(authRouter);
router.use(subscriptionRouter);
router.use(creditsRouter);
router.use(activityRouter);
router.use(spotifyRouter);

export default router;

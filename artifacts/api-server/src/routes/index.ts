import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import chatRouter from "./chat";
import adminRouter from "./admin";
import storageRouter from "./storage";
import passwordResetRouter from "./password-reset";
import paystackRouter from "./paystack";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(chatRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(passwordResetRouter);
router.use(paystackRouter);

export default router;

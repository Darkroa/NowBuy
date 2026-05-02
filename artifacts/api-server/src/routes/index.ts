import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import chatRouter from "./chat";
import adminRouter from "./admin";
import adminProductsRouter from "./admin-products";
import storageRouter from "./storage";
import passwordResetRouter from "./password-reset";
import paystackRouter from "./paystack";
import notificationsRouter from "./notifications";
import supportRouter from "./support";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(chatRouter);
router.use(adminRouter);
router.use(adminProductsRouter);
router.use(storageRouter);
router.use(passwordResetRouter);
router.use(paystackRouter);
router.use(notificationsRouter);
router.use(supportRouter);
router.use(emailRouter);

export default router;

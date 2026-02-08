import { NextFunction, Response, Request } from "express";
import aj from "../config/arcjet";
import { ArcjetNodeRequest, slidingWindow } from "@arcjet/node";

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    try {
        const role: RateLimitRole = req.user?.role ?? "guest";

        let limit: number;
        let message: string;

        switch (role) {
            case "admin":
                limit = 20;
                message = "Admin request limit exceeded (20 per minute)";
                break;
            case "student":
                limit = 10;
                message = "Student request limit exceeded (10 per minute)";
                break;
            case "teacher":
                limit = 15;
                message = "Teacher request limit exceeded (15 per minute)";
                break;
            case "guest":
                limit = 5;
                message = "Guest request limit exceeded (5 per minute)";
                break;
        }

        const client = aj.withRule(
            slidingWindow({
                mode: "LIVE",
                interval: "1m",
                max: limit,
            }),
        );
        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.url,
            socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0" },
        };
        const decision = await client.protect(arcjetRequest);
        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Automated request is not allowed",
            });
        }
        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Request rejected by security policies",
            });
        }
        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({
                error: "Too many request",
                message:
                    "Guest request limit (5 per minute) please sign in for higher limits",
            });
        }
        next();
    } catch (e) {
        console.error("Arcjet middleware error ", e);
        res.status(500).json({
            error: "Internal server error",
            message: "Something went wrong with the security arcjet",
        });
    }
};
export default securityMiddleware;

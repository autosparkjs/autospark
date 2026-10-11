import { NotFoundPage } from "./404";
import { ServiceErrorPage } from "./500";
import { DefaultErrorPage } from "./default";

export const errorPages = {
    "404": NotFoundPage,
    "500": ServiceErrorPage,
    "*": DefaultErrorPage,
};

import { IStore } from "@store/types";
import { notEmpty } from "@root/utils";
import { always, cond, equals, match, T } from "ramda";

export const selectCurrentRoute = ({ router }: IStore) => {
    return cond([
        [equals("/"), always("home")],
        [x => notEmpty(match(/^\/editor\/+/g, x)), always("editor")],
        [x => notEmpty(match(/^\/profile/g, x)), always("profile")],
        [T, always("404")]
    ])(router.location.pathname);
};

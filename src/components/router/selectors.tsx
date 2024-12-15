import { RootState } from "@root/store";
import { notEmpty } from "@root/utils";
import { always, cond, equals, match, T } from "ramda";

export const selectCurrentRoute = ({ router }: RootState): string => {
    return cond([
        [equals("/"), always("home")],
        [(x) => notEmpty(match(/^\/editor\/+/g, x)), always("editor")],
        [(x) => notEmpty(match(/^\/profile/g, x)), always("profile")],
        [T, always("404")]
    ])(router.location.pathname);
};

export const selectCurrentProfileRoute = ({
    router
}: RootState): Array<string | undefined> => {
    // console.log("router", router);
    return router.location;
};

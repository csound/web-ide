export const GET_TAGS = "HOME.GET_TAGS";
interface GetTagsAction {
    type: typeof GET_TAGS;
    payload: any;
}

export type HomeActionTypes = GetTagsAction;

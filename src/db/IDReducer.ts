import { SIGNIN_SUCCESS, LOG_OUT } from "../components/Login/types";
import { IUserProfile } from "./interfaces";

export default (state = {}, action: any): IUserProfile => {
    switch (action.type) {
        case SIGNIN_SUCCESS: {
            return {
                name: action.user.displayName,
                email: action.user.email,
                photoUrl: action.user.photoURL
            };
        }
        case LOG_OUT: {
            return {} as IUserProfile;
        }
        default: {
            return state as IUserProfile;
        }
    }
};

import {
    ICsoundObj,
    ICsoundStatus,
    RUN_CSOUND,
    SET_CSOUND,
    STOP_CSOUND
} from "./types";

export interface ICsoundReducer {
    csound: ICsoundObj | null;
    status: ICsoundStatus;
}

export default (state: any, action: any): ICsoundReducer => {
    switch (action.type) {
        case SET_CSOUND: {
            return {
                csound: action.csound,
                status: state.status
            };
        }
        case RUN_CSOUND: {
            if (!state.csound) {
                return state;
            }
            const contextState = state.csound.getNode().context.state;

            if (contextState === "running") {
                state.csound.reset();
            } else if (state.csound.status === "playing") {
                state.csound.stop();
                state.csound.reset();
            } else if (state.csound.status === "stopped") {
                state.csound.reset();
            }
            state.csound.setOption("-odac");
            state.csound.setOption("-+msg_color=false");
            state.csound.compileCSD("project.csd");
            state.csound.start();

            return {
                csound: state.csound,
                status: "playing"
            };
        }
        case STOP_CSOUND: {
            if (!state.csound) {
                return state;
            }
            const contextState = state.csound.getNode().context.state;

            if (
                state.csound.status === "playing" &&
                contextState === "running"
            ) {
                state.csound.stop();
            }

            return {
                csound: state.csound,
                status: "stopped"
            };
        }
        default: {
            return (
                state ||
                ({
                    csound: null,
                    status: "initialized"
                } as ICsoundReducer)
            );
        }
    }
};

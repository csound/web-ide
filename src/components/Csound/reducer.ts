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
            // const contextState = state.csound.getNode().context.state;
            // if (contextState === "running") {
            //     state.csound.reset();
            // } else if (state.csound.status === "playing") {
            //     state.csound.stop();
            //     state.csound.reset();
            // } else if (state.csound.status === "stopped") {
            //     state.csound.reset();
            // }
            const cs:ICsoundObj = state.csound; 
            cs.audioContext.resume();
            cs.reset();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.compileCSD("project.csd");
            cs.start();

            return {
                csound: cs,
                status: "playing"
            };
        }
        case STOP_CSOUND: {
            if (!state.csound) {
                return state;
            }

            // FIXME - state.csound has no status param
            // const contextState = state.csound.getNode().context.state;

            // if (
                // state.csound.status === "playing" &&
                // contextState === "running"
            // ) {
            state.csound.stop();
            // }

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

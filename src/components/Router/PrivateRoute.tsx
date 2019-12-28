// import { Route, Redirect } from "react-router-dom";
// import React from "react";
// import { getAuthState, getAuthRequesting } from "./selectors";
// import { IStore } from "@store/types";
// import { connect } from "react-redux";
// import LinearProgress from "@material-ui/core/LinearProgress";
//
// interface IPrivateRoute {
//     auth: boolean;
//     Component: any;
//     requesting: boolean;
// }
//
// const PrivateRoute = ({Component, auth, requesting }: IPrivateRoute) => {
//     const render = (props: any) => {
//         if (auth === true) {
//             return <Component {...props} />;
//         } else if (requesting === true) {
//             return <LinearProgress />;
//         } else {
//             return <Redirect to={{ pathname: "/login" }} />;
//         }
//     };
//
//     return <Route render={render} />;
// };
//
// const mapStateToProps = (store: IStore, ownProp: any): IPrivateRoute => {
//     return {
//         auth: getAuthState(store),
//         Component: ownProp.component,
//         requesting: getAuthRequesting(store)
//     };
// };
//
//
// export default connect( mapStateToProps, {} )(PrivateRoute);

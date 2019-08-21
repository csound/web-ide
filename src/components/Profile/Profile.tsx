import React, { Component } from "react";
import withStyles from "./styles";
import { Link } from 'react-router-dom'
import Header from "../Header/Header";
import { projects } from "../../config/firestore";
import { IProject } from "../Projects/interfaces";

class Profile extends Component<any, {}> {
    public render() {

        // Need to fix this...
        let userProjects = projects.where("uid", "==", "0");
        console.log("userProjects:", userProjects);

        let fakeProjects:IProject[] = [1,2,3].map((d) => {
            return {
              projectUid: d + "",
              assets:[],
              name: "Project " + d,
              isPublic: true,
              documents: [],
            }
        });

        let projectLinks = fakeProjects.map(p => 
            <li><Link to={"/editor/username/" + p.projectUid}>{p.name}</Link></li>
        );

        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header showMenuBar={false}/>
                <main>
                    <h1>Profile</h1>
                    <p> </p>
                    <p>
                    <Link to="/editor">
                        + New Project 
                        </Link>
                    </p>
                    <ul>
                      { projectLinks }
                    </ul>
                </main>
            </div>
        )
    }
}

export default withStyles(Profile);

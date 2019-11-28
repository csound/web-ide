import React, { Component } from "react";
import withStyles from "./styles";
import Header from "../Header/Header";

class SiteDocs extends Component<any, {}> {
    public render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header showMenuBar={false} />
                <main className={classes.main}>
                    <h1>Csound Web-IDE</h1>
                    <h2>Introduction</h2>
                    
                    <p>Welcome to the Csound Web-IDE!</p>
                    <p>This site is an online Integrated Development Environment (IDE) 
                        for <a href="https://csound.com">Csound</a>, a sound and music computing system
                        that has its roots in the earliest of computer software, the MUSIC-N series 
                        by <a href="https://en.wikipedia.org/wiki/Max_Mathews">Max Matthews</a>.  
                        Csound was originally released in 1986 
                        by <a href="http://web.media.mit.edu/~bv/">Barry Vercoe</a> and it has 
                        been a part of the computer music world since. Today's Csound works on desktop, 
                        mobile, embedded, server, and web platforms and powers music software and 
                        music-making for musician's around the world.</p>
                    
                    <p>With this site we bring you an online, social coding Csound development experience 
                        with the same features as found traditionally on desktop systems. We hope the 
                        features to compose, live code, share, and discover Csound work will help power your 
                        musical endeavors.</p>  

                    <h2>Getting Started</h2>
                    <h2>Searching and Following</h2>
                    <h2>Creating a New Project</h2>
                    <h2>Editing a Project</h2>
                    <h2>Sharing Projects</h2>
                </main>
            </div>
        );
    }
}

export default withStyles(SiteDocs);

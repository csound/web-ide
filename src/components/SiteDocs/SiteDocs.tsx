import React, { Component } from "react";
import withStyles from "./styles";
import Header from "../Header/Header";

class SiteDocs extends Component<any, {}> {
    public render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header />
                <main className={classes.main}>
                    <h1>Csound Web-IDE</h1>

                    <p>Welcome to the Csound Web-IDE!</p>
                    <p>
                        This site is an online Integrated Development
                        Environment (IDE) for{" "}
                        <a href="https://csound.com">Csound</a>, a sound and
                        music computing system that has its roots in the
                        earliest of computer software, the MUSIC-N series by{" "}
                        <a href="https://en.wikipedia.org/wiki/Max_Mathews">
                            Max Matthews
                        </a>
                        . Csound was originally released in 1986 by{" "}
                        <a href="http://web.media.mit.edu/~bv/">Barry Vercoe</a>{" "}
                        and it has been a part of the computer music world
                        since. Today's Csound works on desktop, mobile,
                        embedded, server, and web platforms and powers music
                        software and music-making for musician's around the
                        world.
                    </p>

                    <p>
                        With this site we bring you an online, social coding
                        Csound development experience with the same features
                        found traditionally on desktop systems. We hope the
                        features to compose, live code, share, and discover
                        Csound work will help power your musical endeavors.
                    </p>

                    <h2>Getting Started</h2>

                    <h3>Searching and Browsing Projects</h3>

                    <h3>Sign up for an account</h3>

                    <p>
                        To use the site for your own work, sign up for an
                        account by using the "Login" button in the top bar. You
                        can sign up using an email account or sign-in using a
                        Google or Facebook account. Once you sign in, you will
                        need to choose a unique username for your account.
                    </p>

                    <h3>View/Edit Profile</h3>

                    <p>
                        The profile page houses your projects. It will show all
                        of your project, public or private, as well as the list
                        of people you follow.
                    </p>
                    <p>
                        You can edit your information on the profile page as
                        well, including updating your user image, bio, and
                        links.
                    </p>
                    <p>
                        The profile page is also where you will be creating and
                        modifying project details. You can also audition
                        projects using play button as well as select the project
                        to view/edit the project in the main IDE editor.
                    </p>

                    <h3>Need assistance?</h3>

                    <p>
                        The easiest way to get help with the Web-IDE is to join
                        the{" "}
                        <a href="https://csound.com/community.html">
                            Csound Slack
                        </a>
                        and ask questions in the #web-ide channel.
                    </p>

                    <h3>Have an issue or find a bug?</h3>

                    <p>
                        If you have an issue, find a bug, or want to make a
                        suggestion for improvement, please either file an issue
                        on the Web-IDE's{" "}
                        <a href="https://github.com/csound/web-ide/issues">
                            Github issue tracker
                        </a>
                        . The tracker allows us to follow up with issues when we
                        can and have a conversation to figure out the best way
                        to address the issue. We look forward to hearing from
                        you!
                    </p>

                    <h2>Creating a New Project</h2>

                    <p>
                        On your profile page, use the "Create +" button to
                        create a new project. A modal dialog will appear where
                        you can fill in the name of the project, description,
                        and any tags. You can later edit the project information
                        using the "Edit" button. The name, description and tags
                        will be visible for the project on your profile page for
                        you and others who may look at your profile (if your
                        project is public). These fields will also be used when
                        users search for projects.
                    </p>

                    <h2>Editing a Project</h2>

                    <p>Within the project editor you will see:</p>

                    <ul>
                        <li>Menu Bar</li>
                        <li>Project File Tree</li>
                        <li>Editors</li>
                        <li>Console Output</li>
                        <li>Csound Manual Panel</li>
                    </ul>

                    <h2>Sharing Projects</h2>
                </main>
            </div>
        );
    }
}

export default withStyles(SiteDocs);

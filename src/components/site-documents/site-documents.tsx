import { mainStyle, rootStyle } from "./styles";
import { Header } from "../header/header";
import { main } from "../projects/styles";

export const SiteDocuments = () => {
    return (
        <div css={rootStyle}>
            <Header />
            <main css={[mainStyle, main]}>
                <section>
                    <h1>Csound Web-IDE</h1>

                    <p>Welcome to the Csound Web-IDE!</p>
                    <p>
                        This site is an online Integrated Development
                        Environment (IDE) for{" "}
                        <a href="https://csound.com">Csound</a>, a sound and
                        music computing system that has its roots in the
                        earliest of computer software, the MUSIC-N series by{" "}
                        <a href="https://en.wikipedia.org/wiki/Max_Mathews">
                            Max Mathews
                        </a>
                        . Csound was originally released in 1986 by{" "}
                        <a href="http://web.media.mit.edu/~bv/">Barry Vercoe</a>{" "}
                        and it has been a part of the computer music world
                        since. Today&apos;s Csound works on desktop, mobile,
                        embedded, server, and web platforms and powers music
                        software and music-making for musician&apos;s around the
                        world.
                    </p>

                    <p>
                        With this site we bring you an online, social coding
                        Csound development experience with the same features
                        found traditionally on desktop systems. We hope the
                        features to compose, live code, share, and discover
                        Csound work will help power your musical endeavors.
                    </p>
                </section>

                <section>
                    <h2>Getting Started</h2>

                    <h3>Searching and Browsing Projects</h3>

                    <p>
                        The home page provides a search option for finding
                        public projects. Enter in search terms to find projects
                        matching the search terms. You can click on the project
                        to view and run the project as well as click on the
                        author to look at their profile. On the author&apos;s
                        profile you will find a list of public projects they
                        have shared as well as have the opportunity to follow
                        that user (if you are logged in).
                    </p>

                    <h3>Sign up for an account</h3>

                    <p>
                        To use the site for your own work, sign up for an
                        account by using the &quot;Login&quot; button in the top
                        bar. You can sign up using an email account or sign-in
                        using a Google or Facebook account. Once you sign in,
                        you will need to choose a unique username for your
                        account.
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
                        projects using the play button on the project as well as
                        select the project to view/edit the project in the main
                        IDE editor.
                    </p>

                    <h3>Need assistance?</h3>

                    <p>
                        The easiest way to get help with the Web-IDE is to join
                        the{" "}
                        <a href="https://csound.com/community.html">
                            Csound Slack
                        </a>{" "}
                        and ask questions in the #web-ide channel.
                    </p>

                    <h3>Have an issue or find a bug?</h3>

                    <p>
                        If you have an issue, find a bug, or want to make a
                        suggestion for improvement, please either file an issue
                        on the Web-IDE&apos;s{" "}
                        <a href="https://github.com/csound/web-ide/issues">
                            Github issue tracker
                        </a>
                        . The tracker allows us to follow up with issues when we
                        can and have a conversation to figure out the best way
                        to address the issue. We look forward to hearing from
                        you!
                    </p>
                </section>

                <section>
                    <h2>Creating a New Project</h2>

                    <p>
                        On your profile page, use the &quot;Create +&quot;
                        button to create a new project. A modal dialog will
                        appear where you can fill in the name of the project,
                        description, and any tags. You can later edit the
                        project information using the &quot;Edit&quot; button.
                        The name, description and tags will be visible for the
                        project on your profile page for you and others who may
                        look at your profile (if your project is public). These
                        fields will also be used when users search for projects.
                    </p>

                    <h2>Editing a Project</h2>

                    <img
                        src="img/project_editor.png"
                        alt="Project Editor"
                        width="100%"
                    ></img>

                    <p>
                        The project editor is made up of a number of components:
                    </p>

                    <ul>
                        <li>Menu Bar</li>
                        <li>Project File Tree</li>
                        <li>File Editors</li>
                        <li>Console Output</li>
                        <li>Play Controls</li>
                        <li>Social Controls</li>
                        <li>
                            Csound Manual Panel (not shown in screenshot above)
                        </li>
                    </ul>

                    <h3>Menu Bar</h3>

                    <p>
                        The menu bar contains dropdown menus for various
                        operations in the Web-IDE such as saving files, opening
                        and closing views (i.e., Project File Tree, Console
                        Ouptput, Csound Manual Panel), and more.
                    </p>

                    <h3>Project File Tree</h3>

                    <p>
                        Projects are made up of files laid out in a directory
                        structure much like they would be when working with
                        Csound on a desktop operating system. Click on a file in
                        the file tree to open up its editor. Organize your code
                        and resource files and use relative paths in the same
                        way as you would if using Csound on the desktop.
                    </p>

                    <h3>File Editors</h3>

                    <p>
                        Editors appear for editing code and working with
                        resource files. Code editors provide syntax
                        highlighting, shortcuts for code evaluation (i.e., live
                        coding), and code completion.
                    </p>

                    <h3>Console Output</h3>

                    <p>
                        The Console Output shows the output messages generated
                        when Csound runs.{" "}
                    </p>

                    <h3>Play Controls</h3>

                    <p>
                        The Play controls include a Play/Pause button, Stop
                        button, and target selection. Each Web-IDE supports
                        using different CSDs as Run targets. This allows you to
                        create a project with multiple CSDs that share code. Use
                        the &quot;Configure&quot; command in the target dropdown
                        to manage targets for your project.
                    </p>

                    <h3>Social Controls</h3>

                    <p>
                        The social controls provide a button to share the
                        project via Facebook, Twitter, and Email; a Star button
                        to like the project; and an eye button to mark the
                        project as public or private. If you are not the author
                        of the project the eye button will not be available, but
                        you may still share or like the project.
                    </p>

                    <h3>Csound Manual Panel</h3>

                    <p>
                        The Web-IDE provides a built-in version of the Csound
                        Manual that you can search through. Examples found in
                        manual entries can also be auditioned directly in the
                        manual panel.
                    </p>
                </section>

                <section>
                    <h2>Audio/MIDI Input</h2>

                    <p></p>
                </section>
            </main>
        </div>
    );
};

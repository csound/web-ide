import React from "react";
import { Link, useParams } from "react-router";
import { DebounceInput } from "react-debounce-input";
import { css } from "@emotion/react";
import { doc, getDoc } from "firebase/firestore";
import Fuse from "fuse.js";
import { manual as manualRef } from "@config/firestore";
import * as ß from "./styles";

export interface StaticManualEntry {
    id: string;
    opname: string;
    type: string;
    short_desc: string;
    synopsis: string[];
}

// function inIframe(): boolean {
//     try {
//         return window.self !== window.top;
//     } catch {
//         return true;
//     }
// }

const formControls = css`
    display: block;
    width: 100%;
    height: 34px;
    padding: 6px 12px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
    transition:
        border-color ease-in-out 0.15s,
        box-shadow ease-in-out 0.15s;
`;

function CsoundManualIndex() {
    const [isMounted, setIsMounted] = React.useState(false);
    const [filterString, setFilterString] = React.useState("");
    const [filteredDocuments, setFilteredDocuments]: [
        any[] | undefined,
        (argz?: any) => void
    ] = React.useState();
    const [allDocuments, setAllDocuments] = React.useState(
        [] as StaticManualEntry[]
    );

    const handleSearch = React.useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            setFilterString(event.currentTarget.value);
            if (event.currentTarget.value) {
                const fuse = new Fuse(allDocuments, {
                    shouldSort: true,
                    findAllMatches: true,
                    threshold: 0.2,
                    location: 0,
                    distance: 100,
                    minMatchCharLength: 1,
                    keys: ["opname", "short_desc"]
                });

                setFilteredDocuments(
                    fuse.search(event.currentTarget.value).map((i) => i.item)
                );
            } else {
                setFilteredDocuments();
            }
        },
        [allDocuments, setFilteredDocuments, setFilterString]
    );

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            document.title = "Csound Manual";
            fetch("/static-manual-index.json").then(async (response) => {
                setAllDocuments((await response.json()) as StaticManualEntry[]);
            });
        }
    }, [isMounted, setIsMounted, setAllDocuments]);

    const scoregens = (
        Array.isArray(filteredDocuments) ? filteredDocuments : allDocuments
    ).filter((doc) => doc.type === "scoregen");
    const opcodes = (
        Array.isArray(filteredDocuments) ? filteredDocuments : allDocuments
    ).filter((doc) => doc.type === "opcode");

    const opcodesComp = opcodes.map((opc, index) => {
        return (
            <Link key={index} to={`/manual/${opc.id}`} css={ß.entry}>
                <div css={ß.opcodeContainer}>
                    <span>{opc.opname}</span>
                </div>
                <p>{opc.short_desc}</p>
            </Link>
        );
    });

    const scoregensComp = scoregens.map((opc, index) => {
        return (
            <Link key={index} to={`/manual/${opc.id}`} css={ß.entry}>
                <div css={ß.opcodeContainer}>
                    <span>{opc.opname}</span>
                </div>
                <p>{opc.short_desc}</p>
            </Link>
        );
    });

    return (
        <div style={{ padding: 24 }}>
            <div>
                <DebounceInput
                    css={formControls}
                    minLength={1}
                    debounceTimeout={300}
                    value={filterString}
                    onChange={handleSearch as any}
                    type="text"
                    className="manual-main-form-control"
                    placeholder="Search by name or description"
                />
            </div>
            <h1 style={{ color: "white" }}>
                The Canonical Csound Reference Manual
            </h1>
            {opcodes.length > 0 && (
                <h2 style={{ color: "#f2f2f2" }}>
                    Orchestra Opcodes and Operators
                </h2>
            )}
            {opcodesComp}
            {scoregens.length > 0 && (
                <h2 style={{ color: "#f2f2f2" }}>
                    Score Statements and GEN Routines
                </h2>
            )}
            {scoregensComp}
        </div>
    );
}

const staticStyles = `
  #root { overflow-x: hidden; padding: 12px!important; }
  div,p { color: white; }
  .manual-synopsis-container {
    background-color: black;
  }
  .manual-synopsis {
    font-weight: 100;
    font-size: 14px;
    color: rgb(255,255,255);
    background-color: black;
    padding: 0;
    margin: 0;
  }

  code {
    white-space: pre;
  }

  .manual-refsect1 h1 {
    font-weight: 100;
    color: white;
  }
  #title h1 {
     color: white;
  }

  h2 {
    color: #f2f2f2;
  }
`;

function CsoundManualEntry({ id }: { id: string }) {
    const [isMounted, setIsMounted] = React.useState(false);
    const [htmlEntry, setHtmlEntry] = React.useState("");

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            getDoc(doc(manualRef, id))
                .then(async (snapshot) => {
                    const data = await snapshot.data();
                    if (
                        typeof data === "object" &&
                        typeof data.html === "string"
                    ) {
                        setHtmlEntry(data.html.replace(/&#xD;/g, "\n"));
                    }
                })
                .catch(() => setIsMounted(false));
        }
    }, [isMounted, setIsMounted, id, setHtmlEntry]);

    return (
        <div>
            <style>{staticStyles}</style>
            <div dangerouslySetInnerHTML={{ __html: htmlEntry }} />
        </div>
    );
}

export default function CsoundManual() {
    const routerParams = useParams();

    return routerParams && routerParams.id ? (
        <CsoundManualEntry id={routerParams.id} />
    ) : (
        <CsoundManualIndex />
    );
}

import React from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { manual as manualRef } from "@config/firestore";
import * as ß from "./styles";

export interface StaticManualEntry {
    id: string;
    opname: string;
    type: string;
    short_desc: string;
    synopsis: string[];
}

function CsoundManualIndex() {
    const [isMounted, setIsMounted] = React.useState(false);
    const [allDocuments, setAllDocuments] = React.useState(
        [] as StaticManualEntry[]
    );

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            fetch("/static-manual-index.json").then(async (response) => {
                setAllDocuments((await response.json()) as StaticManualEntry[]);
            });
        }
    }, [isMounted, setIsMounted, setAllDocuments]);

    const scoregens = allDocuments.filter((doc) => doc.type === "scoregen");
    const opcodes = allDocuments.filter((doc) => doc.type === "opcode");

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
        <div>
            <h1 style={{ color: "white" }}>
                The Canonical Csound Reference Manual
            </h1>
            {opcodes.length > 0 && <h2>Orchestra Opcodes and Operators</h2>}
            {opcodesComp}
            {scoregens.length > 0 && <h2>Score Statements and GEN Routines</h2>}
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

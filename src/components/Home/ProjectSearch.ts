export const projectSearch = query => {
    console.log(query);

    let target;
    if (process.env.REACT_APP_DATABASE === "DEV") {
        target = "csound-ide";
    } else if (process.env.REACT_APP_DATABASE === "PROD") {
        target = "csound-ide-dev";
    }

    const sq = {
        structuredQuery: {
            where: {
                fieldFilter: {
                    field: {
                        fieldPath: "members.[memberID]"
                    },
                    op: "EQUAL",
                    value: {
                        booleanValue: "true"
                    }
                }
            },
            from: [
                {
                    collectionId: "channels"
                }
            ]
        }
    };
    fetch(
        `https://firestore.googleapis.com/v1/projects/${target}/databases/(default)/documents/projects`,
        {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },

            //make sure to serialize your JSON body
            body: JSON.stringify({
                structuredQuery: {
                    where: {
                        fieldFilter: {
                            field: {
                                fieldPath: "data.public"
                            },
                            op: "EQUAL",
                            value: {
                                booleanValue: "true"
                            }
                        }
                    }
                }
            })
        }
    )
        .then(async response => {
            const json = await response.json();
            console.log(json);
        })
        .catch(error => {
            console.log(error);
        });
};

*** Settings ***
Library           RequestsLibrary
Library           Collections
Variables         ../../resources/env_variables.py

*** Test Cases ***
Muokkaa olemassa olevaa merkintää ja varmista päivitys
    Create Session    backend    ${BACKEND_URL}

    # Kirjaudu sisään ja hae token
    ${login_payload}=    Create Dictionary    kayttajanimi=${REGISTER_USERNAME}    salasana=${REGISTER_PASSWORD}
    ${response}=         POST    ${BACKEND_URL}/auth/login    json=${login_payload}
    Should Be Equal As Integers    ${response.status_code}    200

    ${json}=    Set Variable    ${response.json()}
    ${token}=   Get From Dictionary    ${json['data']}    token
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json

    # Päivitä merkintä (PUT) päivälle 2025-05-01
    ${entry}=    Create Dictionary
    ...    pvm=2025-05-01
    ...    vs_ilta=9
    ...    kommentti=muokattu kommentti robot testeihin!

    ${res}=    PUT    ${BACKEND_URL}/entries    headers=${headers}    json=${entry}
    Should Be Equal As Integers    ${res.status_code}    200

    # Hae toukokuun merkinnät
    ${params}=    Create Dictionary    year=2025    month=05
    ${get}=    GET    ${BACKEND_URL}/entries    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${get.status_code}    200

    ${data}=    Get From Dictionary    ${get.json()}    data
    ${kommentti}=    Set Variable    NOT_FOUND

    FOR    ${merkinta}    IN    @{data}
        ${pvm}=    Get From Dictionary    ${merkinta}    pvm
        Run Keyword If    '${pvm}' == '2025-05-01'    Set Test Variable    ${kommentti}    ${merkinta['kommentti']}
    END

    Should Be Equal    ${kommentti}    muokattu kommentti robot testeihin!

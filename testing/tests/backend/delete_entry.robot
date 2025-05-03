*** Settings ***
Library           RequestsLibrary
Library           Collections
Variables         ../../variables/env_variables.py

*** Test Cases ***
Poista olemassa oleva merkintä ja varmista poisto
    Create Session    backend    ${BACKEND_URL}

    # Kirjaudu sisään ja hae token
    ${login_payload}=    Create Dictionary    kayttajanimi=${REGISTER_USERNAME}    salasana=${REGISTER_PASSWORD}
    ${response}=         POST    ${BACKEND_URL}/auth/login    json=${login_payload}
    Should Be Equal As Integers    ${response.status_code}    200

    ${json}=    Set Variable    ${response.json()}
    ${token}=   Get From Dictionary    ${json['data']}    token
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json

    # Poista merkintä päivältä 2025-05-02
    ${delete}=    DELETE    ${BACKEND_URL}/entries/2025-05-13    headers=${headers}
    Should Be Equal As Integers    ${delete.status_code}    200

    # Tarkista, ettei merkintä enää ole mukana toukokuun merkinnöissä
    ${params}=    Create Dictionary    year=2025    month=05
    ${get}=    GET    ${BACKEND_URL}/entries    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${get.status_code}    200

    ${data}=    Get From Dictionary    ${get.json()}    data
    ${merkinnat}=    Create List

    FOR    ${merkinta}    IN    @{data}
        ${pvm}=    Get From Dictionary    ${merkinta}    pvm
        Append To List    ${merkinnat}    ${pvm}
    END

    List Should Not Contain Value    ${merkinnat}    2025-05-13

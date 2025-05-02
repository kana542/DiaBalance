*** Settings ***
Library           RequestsLibrary
Library           Collections
Variables         ../../resources/env_variables.py

*** Test Cases ***
Lisää kaksi merkintää kalenteriin
    Create Session    backend    ${BACKEND_URL}

    ${login_payload}=    Create Dictionary    kayttajanimi=${REGISTER_USERNAME}    salasana=${REGISTER_PASSWORD}
    ${response}=         POST    ${BACKEND_URL}/auth/login    json=${login_payload}
    Should Be Equal As Integers    ${response.status_code}    200

    ${json}=             Set Variable    ${response.json()}
    ${token}=            Get From Dictionary    ${json['data']}    token
    ${headers}=          Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json

    
    ${entry1}=    Create Dictionary
    ...    pvm=2025-05-10
    ...    vs_aamu=7.9
    ...    kommentti=robot merkinnän testaus

    ${res1}=    POST    ${BACKEND_URL}/entries    headers=${headers}    json=${entry1}
    Should Be Equal As Integers    ${res1.status_code}    201

    
    ${entry2}=    Create Dictionary
    ...    pvm=2025-05-11
    ...    vs_aamu=13.9
    ...    kommentti=robot merkinnän testaus

    ${res2}=    POST    ${BACKEND_URL}/entries    headers=${headers}    json=${entry2}
    Should Be Equal As Integers    ${res2.status_code}    201

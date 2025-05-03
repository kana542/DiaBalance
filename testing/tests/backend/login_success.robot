*** Settings ***
Library     RequestsLibrary
Library     Collections         
Variables       ../../variables/env_variables.py

*** Test Cases ***
Onnistunut kirjautuminen palauttaa 200 ja tokenin
    Create Session    backend    ${BACKEND_URL}
    ${data}=    Create Dictionary
    ...    kayttajanimi=${REGISTER_USERNAME}
    ...    salasana=${REGISTER_PASSWORD}
    ${response}=    POST    ${BACKEND_URL}/auth/login    json=${data}
    Should Be Equal As Integers    ${response.status_code}    200
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json['data']}    token

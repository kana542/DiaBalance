*** Settings ***
Library           RequestsLibrary
Variables         ../../resources/env_variables.py

*** Test Cases ***
Puuttuva salasana palauttaa 400
    Create Session    backend    ${BACKEND_URL}
    ${data}=    Create Dictionary    kayttajanimi=${REGISTER_USERNAME}
    ${response}=    POST    ${BACKEND_URL}/auth/login    json=${data}    expected_status=400
    Should Be Equal As Integers    ${response.status_code}    400
   



*** Settings ***
Library           RequestsLibrary
Variables         ../../resources/env_variables.py

*** Test Cases ***
Virheellinen kirjautuminen palauttaa 401
    Create Session    backend    ${BACKEND_URL}
    ${data}=    Create Dictionary    kayttajanimi=vaarakayttaja    salasana=vaara
    ${response}=    POST    ${BACKEND_URL}/auth/login    json=${data}   expected_status=401
    Should Be Equal As Integers    ${response.status_code}    401
    Log    ${response.json()['message']}
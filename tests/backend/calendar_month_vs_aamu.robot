*** Settings ***
Library           RequestsLibrary
Library           Collections
Variables         ../../resources/env_variables.py

*** Test Cases ***
Tarkista vs_aamu-arvot toukokuulta
    Create Session    backend    ${BACKEND_URL}

    # Kirjaudu ja hae token
    ${login_payload}=    Create Dictionary    kayttajanimi=${REGISTER_USERNAME}    salasana=${REGISTER_PASSWORD}
    ${response}=         POST    ${BACKEND_URL}/auth/login    json=${login_payload}
    Should Be Equal As Integers    ${response.status_code}    200

    ${json}=             Set Variable    ${response.json()}
    ${token}=            Get From Dictionary    ${json['data']}    token
    ${headers}=          Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json

    # Haetaan toukokuun 2025 merkinnät
    ${params}=    Create Dictionary    year=2025    month=05
    ${get_response}=    GET    ${BACKEND_URL}/entries    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${get_response.status_code}    200

    # Parsitaan vastaus ja kerätään vs_aamu-arvot
    ${kuukausi}=    Get From Dictionary    ${get_response.json()}    data
    ${vs_aamut}=    Create List
    FOR    ${merkinta}    IN    @{kuukausi}
        ${arvo}=    Get From Dictionary    ${merkinta}    vs_aamu
        Append To List    ${vs_aamut}    ${arvo}
    END

    Log To Console    Löydetyt vs_aamu-arvot: ${vs_aamut}

    # Tarkistetaan, että odotetut arvot löytyvät
    List Should Contain Value    ${vs_aamut}    13.9
    

*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource

*** Test Cases ***
Test login_fail
    Avaa Sovellus
    Click    id=authButton
    Sleep    1s
    Type Text      id=email        ${EMAIL}    delay=0.1s
    Type Text    id=password     vääräsalasana123    delay=0.1s
    Click          button:has-text("Kirjaudu")
    Sleep          1s
    Get Text       id=error-message   ==    Virheellinen salasana

*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource

*** Test Cases ***
Test login_success
    Avaa Sovellus
    Click    id=authButton
    Sleep    1s
    Kirjaudu Sovellukseen
    Vahvista Kirjautuminen Onnistui


    
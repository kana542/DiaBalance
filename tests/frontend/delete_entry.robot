*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource
Resource    ../resources/calendarKeywords.resource

*** Test Cases ***
Test delete_entry
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s
    Kirjaudu Sovellukseen
    Vahvista Kirjautuminen Onnistui

    #Tästä alkaa merkinnän poistaminen
    Siirry kalenteriin ja valitse päivä     2025-04-21
    Poista merkintä

    
    


    
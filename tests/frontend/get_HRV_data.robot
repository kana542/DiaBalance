*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource
Resource    ../resources/calendarKeywords.resource

*** Test Cases ***
Test get HRV-data from Kubios
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s
    Kirjaudu Sovellukseen
    Vahvista Kirjautuminen Onnistui

    #Tästä alkaa HRV-datan hakeminen
    Siirry kalenteriin ja valitse päivä     2025-04-22
    Hae HRV-data ja tallenna

    
    


    
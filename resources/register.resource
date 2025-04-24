*** Settings ***
Variables    resources/env_variables.py

*** Keywords ***
Avaa Sovellus
    New Browser    chromium    headless=No
    New Page       http://localhost:3001/
    Sleep   1s

Rekisteröidy sovellukseen
    Click    css=a[href="register.html"]


    Type Text    id=username          ${NEW_REGISTER_USERNAME}      delay=0.3s
    Type Text    id=email             ${NEW_REGISTER_EMAIL}         delay=0.3s     
    Type Secret  id=password          $NEW_REGISTER_PASSWORD        delay=0.3s
    Type Secret  id=confirmPassword   $NEW_REGISTER_PASSWORD        delay=0.3s
    
    Click   text=Luo tunnus


Developer/Author: Johnny Nguyen
Date: December 10, 2021

To Run:
1. unzip the folder
2. have the mongo shell ready to go
3. type in integrated terminal 'npm i'
4. Once all dependencies are done installing you want to initialize the database by typing in 'node database-initializer.js'
5. Once the database has been initialized, you can now type 'npm run run' to start the server.


Design Decisions:
In previous versions of my program, I would use handle my requests by using external router files, but because I found it kind of difficult to transfer the database connection over to the router file, I decided to scrap that idea and move everything into my server file. This made it easier to access the database, as well as variables. I tried to make functions that corresponded to the handle requests to make the code look more readibly and less messy.

Possible Limitations:
For some reason when I'm running the code, it will sometimes appear with the error: 'Argument passed in must be a string of 12 byte...', and sometimes the page will load. I honestly have no clue as to why the chances of the page loading are 50/50, but if you can, please try reload the page again if it doesn't load.

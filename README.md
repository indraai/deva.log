# Log Deva

This is the README file for Log Deva, a component of the Deva system.

Log Deva is a component of the Deva system designed to handle logging and event tracking. It provides functionalities for logging various events and actions within the Deva ecosystem. With Log Deva, you can easily track and monitor the activity and progress of your Deva agents. It offers listeners for state, action, question, answer, and error events, allowing you to capture and log important information. Log Deva also includes methods and functions for generating unique IDs, retrieving status information, and accessing help documentation. Choose Log Deva for efficient and comprehensive event logging in your Deva projects.

## Overview
Log Deva is designed to handle logging and event tracking within the Deva ecosystem. It provides functionalities for logging various events and actions that occur within the system.

## Installation
To install Log Deva, you can use npm:

```
npm install @indra.ai/logdeva
```

## Usage
To use Log Deva, you can import it into your project:

```javascript
const LogDeva = require('@indra.ai/logdeva');
```

### Variables
- `relay`: The `relay` variable holds the event name for the relay to the CLI.

### Listeners
- `devacore:state`: The core listener for state events.
- `devacore:action`: The core listener for action events.
- `devacore:question`: The core listener for question events.
- `devacore:answer`: The core listener for answer events.
- `devacore:error`: The core listener for error events.

### Functions
Functions are local functionalities specific to Log Deva that can be used in listeners and methods.

- `this.func.log_action(packet)`: Logs an action event.
- `this.func.log_state(packet)`: Logs a state event.
- `this.func.log_question(packet)`: Logs a question event.
- `this.func.log_answer(packet)`: Logs an answer event.
- `this.func.log_write(packet)`: Logs a write event.

### Methods
Methods are exposed as commands for Log Deva and other Deva components to use.

- `$ #logdeva uid`: Generates a unique ID from Log Deva.
- `$ #logdeva status`: Returns the status of Log Deva.
- `$ #logdeva help`: Provides help for using Log Deva.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Thank you for choosing Log Deva for your logging and event tracking needs. If you have any further questions or need assistance, feel free to reach out.

Copyright (c) 2023 Quinn Michaels

# AccountCreator

This package allows the user to create accounts for the video game Dofus.

## Installation

You must have node & npm installed on your machine. Install the package using the following command:

```bash
npm install -g bbf
```

or

```bash
yarn global add bbf
```

if you use yarn.

## Usage

Run the following command to init your BBF configuration file:

```bash
bbf
```

or

```bash
bbf init
```

If you already have a configuration file, you're all set! Create accounts using the following command:

```bash
bbf create --username=<DESIRED_USERNAME> --password=<DESIRED_PASSWORD> --date=<dD/mM/YYYY> --email=<xxx@xxx.xx>
```

The email is optional if you have setup a "domain" in your configuration file. If no email is specified and a domain is present in your `config.json`, the email will automatically be created according to: <DESIRED_USERNAME>@<DOMAIN>.

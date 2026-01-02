# ==========================
# CLEAN PCC + PCQ (ROS v7)
# LAN: ether6-OUT
# ==========================

:local LAN_IF "ether6-OUT"

# ---- LAN subnets list (edit if needed) ----
/ip firewall address-list remove [find list="LAN_LOCAL"]
/ip firewall address-list add list=LAN_LOCAL address=172.8.16.0/24 comment="LAN 1"
/ip firewall address-list add list=LAN_LOCAL address=172.9.16.0/24 comment="LAN 2"

:log warning "CLEAN: starting rebuild"

# ==========================
# A) CLEAN OLD AUTO OBJECTS
# ==========================
/ip firewall mangle remove [find comment="CLEAN-PCC"]
/ip route remove [find comment="CLEAN-PCC"]
/routing table remove [find where name~"^rt_pppoe_"]
/queue tree remove [find where comment="CLEAN-QT"]
/queue type remove [find where name~"^PCQ_"]

# ==========================
# B) PCQ TYPES (LOW LATENCY)
# ==========================
/queue type add name=PCQ_GAME_UP_2M  kind=pcq pcq-rate=2M  pcq-classifier=src-address pcq-limit=20 pcq-total-limit=1000
/queue type add name=PCQ_VOICE_UP_1M kind=pcq pcq-rate=1M  pcq-classifier=src-address pcq-limit=10 pcq-total-limit=500
/queue type add name=PCQ_VIDEO_UP_3M kind=pcq pcq-rate=3M  pcq-classifier=src-address pcq-limit=40 pcq-total-limit=2000
/queue type add name=PCQ_BESTEFF_UP  kind=pcq pcq-rate=0   pcq-classifier=src-address pcq-limit=50 pcq-total-limit=4000

# ==========================
# C) DETECT RUNNING PPPoE OUT
# ==========================
:local wans [/interface pppoe-client find where running=yes and name~"^pppoe-out"]
:local n [:len $wans]

:put ("RUNNING PPPoE OUT = " . $n)
:if ($n < 2) do={ :log error ("Need >=2 running PPPoE. Found " . $n) ; :error "Not enough WANs" }

# ==========================
# D) BUILD PCC (v7 routing tables)
# ==========================
:local idx 0
:foreach i in=$wans do={

  :local wan [/interface pppoe-client get $i name]
  :local rt ("rt_pppoe_" . $wan)
  :local cm ("cm_" . $wan)

  # routing table + default route
  /routing table add name=$rt fib=yes
  /ip route add dst-address=0.0.0.0/0 gateway=$wan routing-table=$rt distance=1 comment="CLEAN-PCC"

  # PCC connection mark
  /ip firewall mangle add chain=prerouting in-interface=$LAN_IF src-address-list=LAN_LOCAL dst-address-type=!local connection-state=new \
    per-connection-classifier=("both-addresses-and-ports:" . $n . "/" . $idx) \
    action=mark-connection new-connection-mark=$cm passthrough=yes comment="CLEAN-PCC"

  # routing mark
  /ip firewall mangle add chain=prerouting in-interface=$LAN_IF connection-mark=$cm \
    action=mark-routing new-routing-mark=$rt passthrough=no comment="CLEAN-PCC"

  :set idx ($idx + 1)
}

:log warning ("CLEAN: PCC built for " . $idx . " WANs")

# ==========================
# E) QUEUE TREES PER PPPoE
# (Upload shaping per PPPoE interface)
# ==========================
:foreach i in=$wans do={
  :local wan [/interface pppoe-client get $i name]

  /queue tree add name=("QT_VOICE_" . $wan) parent=$wan packet-mark=voice_packet  queue=PCQ_VOICE_UP_1M max-limit=3M priority=1 comment="CLEAN-QT"
  /queue tree add name=("QT_GAME_"  . $wan) parent=$wan packet-mark=gaming_packet queue=PCQ_GAME_UP_2M  max-limit=4M priority=2 comment="CLEAN-QT"
  /queue tree add name=("QT_VIDEO_" . $wan) parent=$wan packet-mark=video_packet  queue=PCQ_VIDEO_UP_3M max-limit=6M priority=4 comment="CLEAN-QT"
  /queue tree add name=("QT_OTHER_" . $wan) parent=$wan                       queue=PCQ_BESTEFF_UP  max-limit=0  priority=8 comment="CLEAN-QT"
}

:log warning "CLEAN: queues built"
:put "DONE: CLEAN PCC + PCQ + Queue Trees created."

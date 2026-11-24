import ipaddress
import re
from fastapi import Request

def get_real_client_ip(request: Request) -> str:
    """
    Safely extract real client IP address across reverse proxies (Cloudflare, Nginx, Caddy, Traefik, Docker).
    Prioritizes trusted proxy headers before falling back to request.client.host.
    """
    # 1. Cloudflare header
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip and is_valid_ip(cf_ip.strip()):
        return cf_ip.strip()

    # 2. True-Client-IP (Cloudflare Enterprise / Akamai)
    true_client_ip = request.headers.get("True-Client-IP")
    if true_client_ip and is_valid_ip(true_client_ip.strip()):
        return true_client_ip.strip()

    # 3. X-Forwarded-For header (leftmost entry is the initial client)
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
        for ip in ips:
            if is_valid_ip(ip):
                return ip

    # 4. X-Real-IP
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip and is_valid_ip(x_real_ip.strip()):
        return x_real_ip.strip()

    # 5. Direct socket connection
    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"

def is_valid_ip(ip_str: str) -> bool:
    """Validate IPv4 or IPv6 format."""
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False

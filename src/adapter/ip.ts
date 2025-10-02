import * as ipaddr from "ipaddr.js";

type SocketPair = {
  srcAddr: string; // 來源 IP 位址 (IPv4 或 IPv6)
  srcPort: number; // 來源 Port (0-65535)
  dstAddr: string; // 目標 IP 位址 (IPv4 或 IPv6)
  dstPort: number; // 目標 Port (0-65535)
};

/**
 * 將 IPv4 或 IPv6 地址轉換為 IPv6 地址
 */
const toIPv6 = (addr: ipaddr.IPv4 | ipaddr.IPv6): ipaddr.IPv6 => {
  let ipv6Addr: ipaddr.IPv6;

  if (addr.kind() === "ipv4") {
    const ipv4 = addr as ipaddr.IPv4;
    ipv6Addr = ipv4.toIPv4MappedAddress();
  } else {
    ipv6Addr = addr as ipaddr.IPv6;
  }

  return ipv6Addr;
};

/**
 * 將 IP 地址轉換為可讀字串，IPv4-mapped IPv6 會轉回 IPv4 字串
 */
const stringifyAddress = (ip: string) => {
  try {
    const addr = ipaddr.process(ip);

    if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      return (addr as ipaddr.IPv6).toIPv4Address().toString();
    }

    return addr.toNormalizedString();
  } catch (error) {
    return ip + " (Invalid)";
  }
};

/**
 * 將 SocketPair 轉換為可讀字串
 */
const stringifySocketPair = (pair: SocketPair) => {
  const src = `${stringifyAddress(pair.srcAddr)}:${pair.srcPort}`;
  const dst = `${stringifyAddress(pair.dstAddr)}:${pair.dstPort}`;
  return `(${src} => ${dst})`;
};

/**
 * 解析並轉換 IP 地址為 16 字節的 Buffer
 */
const createAddressBuffer = (ip: string): Buffer => {
  try {
    const addr = ipaddr.process(ip);
    return Buffer.from(toIPv6(addr).toByteArray());
  } catch (error) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
};

/**
 * 解析並轉換 Buffer 為可以丟給 net.connect 的 IP 字串
 */
const parseAddressBuffer = (buffer: Buffer): string => {
  return ipaddr.fromByteArray(Array.from(buffer)).toString();
};

/**
 * 抽象類別：SocketPair 集合，提供統一的 key 生成方法
 */
abstract class AbstractSocketPairCollection {
  protected getKey(pair: SocketPair): string {
    const srcIP = toIPv6(ipaddr.process(pair.srcAddr)).toNormalizedString();
    const dstIP = toIPv6(ipaddr.process(pair.dstAddr)).toNormalizedString();
    return `${srcIP}:${pair.srcPort}=>${dstIP}:${pair.dstPort}`;
  }
}

/**
 * 特殊可用 socketPair 作為 key 的 Map
 */
class SocketPairMap<V> extends AbstractSocketPairCollection {
  private map = new Map<string, V>();

  set(pair: SocketPair, value: V): void {
    this.map.set(this.getKey(pair), value);
  }

  get(pair: SocketPair): V | undefined {
    return this.map.get(this.getKey(pair));
  }

  has(pair: SocketPair): boolean {
    return this.map.has(this.getKey(pair));
  }

  delete(pair: SocketPair): boolean {
    return this.map.delete(this.getKey(pair));
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

/**
 * 特殊可用 socketPair 作為 key 的 Set
 */
class SocketPairSet extends AbstractSocketPairCollection {
  private set = new Map<string, SocketPair>();

  add(pair: SocketPair): this {
    this.set.set(this.getKey(pair), pair);
    return this;
  }

  has(pair: SocketPair): boolean {
    return this.set.has(this.getKey(pair));
  }

  delete(pair: SocketPair): boolean {
    return this.set.delete(this.getKey(pair));
  }

  clear(): void {
    this.set.clear();
  }

  get size(): number {
    return this.set.size;
  }

  values(): IterableIterator<SocketPair> {
    return this.set.values();
  }

  [Symbol.iterator](): IterableIterator<SocketPair> {
    return this.values();
  }
}

export { createAddressBuffer, parseAddressBuffer, stringifyAddress, stringifySocketPair };
export { SocketPair, SocketPairMap, SocketPairSet };

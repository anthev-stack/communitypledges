"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { SUPPORTED_GAMES } from "@/lib/supported-games"
import { REGIONS, getTagsForGame } from "@/lib/game-tags"
import { useCurrency } from "@/components/CurrencyProvider"
import { getCurrencyName } from "@/lib/currency"
import ImageUpload from "@/components/ImageUpload"
import MinecraftJavaFields from "@/components/server/MinecraftJavaFields"
import { isMinecraftJavaEdition } from "@/lib/minecraft-java"

interface Community {
  id: string
  name: string
}

export default function CreateServerPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { currency, symbol, convertToUSD, isLoading: currencyLoading } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [stripeStatus, setStripeStatus] = useState<any>(null)
  const [checkingStripe, setCheckingStripe] = useState(true)
  const [communities, setCommunities] = useState<Community[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gameType: "",
    serverIp: "",
    serverPort: "",
    cost: "",
    withdrawalDay: "15",
    imageUrl: "",
    region: "",
    tags: [] as string[],
    communityId: "",
    discordWebhook: "",
    isPrivate: false,
    isRealm: false,
    minecraftVersion: "",
    minecraftEditionType: "",
    minecraftModLoader: "",
    hasModrinthInstance: false,
  })
  const [modrinthFile, setModrinthFile] = useState<File | null>(null)

  useEffect(() => {
    checkStripeConnection()
    fetchCommunities()
  }, [])

  const checkStripeConnection = async () => {
    try {
      const response = await fetch("/api/stripe/connect")
      const data = await response.json()
      setStripeStatus(data)

      if (!data.onboardingComplete) {
        setError("You must connect your Stripe account before creating a server")
      }
    } catch (error) {
      setError("Failed to check Stripe status")
    } finally {
      setCheckingStripe(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/user/communities")
      if (response.ok) {
        const data = await response.json()
        setCommunities(data)
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripeStatus?.onboardingComplete) {
      setError("Please connect your Stripe account first")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (isMinecraftJavaEdition(formData.gameType)) {
        if (formData.hasModrinthInstance && !modrinthFile) {
          setError("Please upload your Modrinth instance file")
          setLoading(false)
          return
        }
      }

      // Convert cost from user's local currency to USD
      const costInLocalCurrency = parseFloat(formData.cost)
      const costInUSD = currency !== 'USD' ? convertToUSD(costInLocalCurrency) : costInLocalCurrency

      const response = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cost: costInUSD.toFixed(2), // Store as USD in database
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create server")
        return
      }

      if (isMinecraftJavaEdition(formData.gameType) && formData.hasModrinthInstance && modrinthFile) {
        const uploadData = new FormData()
        uploadData.append("file", modrinthFile)
        const uploadRes = await fetch(`/api/servers/${data.id}/modrinth-instance`, {
          method: "POST",
          body: uploadData,
        })
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json()
          setError(
            uploadErr.error ||
              "Server created but Modrinth upload failed. Edit your server to upload the instance."
          )
          router.push(`/dashboard/server/${data.id}/edit`)
          return
        }
      }

      // Redirect to the new server page
      router.push(`/servers/${data.id}`)
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // If changing game type, reset tags
    if (name === "gameType") {
      setFormData({
        ...formData,
        [name]: value,
        tags: [],
        minecraftVersion: "",
        minecraftEditionType: "",
        minecraftModLoader: "",
        hasModrinthInstance: false,
      })
      setModrinthFile(null)
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const availableTags = formData.gameType ? getTagsForGame(formData.gameType) : []

  if (!session) {
    router.push("/login")
    return null
  }

  if (checkingStripe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking account status...</p>
        </div>
      </div>
    )
  }

  if (!stripeStatus?.onboardingComplete) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stripe Account Required</h2>
              <p className="text-gray-600 mb-6">
                You need to connect your Stripe account before you can create a server and receive donations.
              </p>
              <div className="space-y-3">
                <Link
                  href="/settings"
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Connect Stripe in Settings
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create Game Server Listing</h1>
            <p className="text-sm text-gray-600 mt-1">
              Share your server with the community and start receiving donations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Server Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Server Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Server name here!"
              />
            </div>

            {/* Game Type */}
            <div>
              <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-1">
                Game Type <span className="text-red-600">*</span>
              </label>
              <select
                id="gameType"
                name="gameType"
                required
                value={formData.gameType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a game...</option>
                <optgroup label="FPS Games">
                  <option value="Counter-Strike 2">Counter-Strike 2</option>
                  <option value="Counter-Strike: Global Offensive">CS:GO</option>
                  <option value="Counter-Strike: Source">CS: Source</option>
                  <option value="Team Fortress 2">Team Fortress 2</option>
                  <option value="Left 4 Dead 2">Left 4 Dead 2</option>
                  <option value="Insurgency: Sandstorm">Insurgency: Sandstorm</option>
                  <option value="Squad">Squad</option>
                  <option value="Hell Let Loose">Hell Let Loose</option>
                  <option value="Pavlov VR">Pavlov VR</option>
                </optgroup>
                <optgroup label="Survival/Sandbox">
                  <option value="Minecraft: Java Edition">Minecraft: Java Edition</option>
                  <option value="Minecraft: Bedrock Edition">Minecraft: Bedrock Edition</option>
                  <option value="Rust">Rust</option>
                  <option value="ARK: Survival Evolved">ARK: Survival Evolved</option>
                  <option value="ARK: Survival Ascended">ARK: Survival Ascended</option>
                  <option value="7 Days to Die">7 Days to Die</option>
                  <option value="Valheim">Valheim</option>
                  <option value="V Rising">V Rising</option>
                  <option value="Conan Exiles">Conan Exiles</option>
                  <option value="DayZ">DayZ</option>
                  <option value="SCUM">SCUM</option>
                  <option value="The Forest">The Forest</option>
                  <option value="Sons of The Forest">Sons of The Forest</option>
                  <option value="Terraria">Terraria</option>
                </optgroup>
                <optgroup label="Racing">
                  <option value="Assetto Corsa">Assetto Corsa</option>
                  <option value="Assetto Corsa Competizione">Assetto Corsa Competizione</option>
                  <option value="BeamMP (BeamNG.drive)">BeamMP (BeamNG.drive)</option>
                </optgroup>
                <optgroup label="Tactical/Mil-Sim">
                  <option value="ArmA 3">ArmA 3</option>
                  <option value="Rising Storm 2: Vietnam">Rising Storm 2: Vietnam</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Garry's Mod">Garry&apos;s Mod</option>
                  <option value="Unturned">Unturned</option>
                  <option value="Project Zomboid">Project Zomboid</option>
                  <option value="Space Engineers">Space Engineers</option>
                  <option value="FiveM (GTA V)">FiveM (GTA V)</option>
                  <option value="Killing Floor 2">Killing Floor 2</option>
                  <option value="Mordhau">Mordhau</option>
                  <option value="Chivalry 2">Chivalry 2</option>
                </optgroup>
              </select>
            </div>

            <MinecraftJavaFields
              gameType={formData.gameType}
              values={{
                minecraftVersion: formData.minecraftVersion,
                minecraftEditionType: formData.minecraftEditionType,
                minecraftModLoader: formData.minecraftModLoader,
                hasModrinthInstance: formData.hasModrinthInstance,
              }}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
              modrinthFile={modrinthFile}
              onModrinthFileChange={setModrinthFile}
            />

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tell players about your server, mods, rules, community, etc."
              />
            </div>

            {/* Region */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Server Region
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select region...</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Helps players find servers close to them
              </p>
            </div>

            {/* Community Link */}
            {communities.length > 0 && (
              <div>
                <label htmlFor="communityId" className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Community (Optional)
                </label>
                <select
                  id="communityId"
                  name="communityId"
                  value={formData.communityId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No community</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Link this server to your community profile to help promote it
                </p>
              </div>
            )}

            {/* Discord Webhook */}
            <div>
              <label htmlFor="discordWebhook" className="block text-sm font-medium text-gray-700 mb-1">
                Discord Webhook URL (Optional)
              </label>
              <input
                type="url"
                id="discordWebhook"
                name="discordWebhook"
                value={formData.discordWebhook}
                onChange={handleChange}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get notified in Discord when someone pledges to your server. 
                <a 
                  href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 ml-1"
                >
                  Learn how to create a webhook →
                </a>
              </p>
            </div>

            {/* Private/Public Server */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Server Visibility
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isPrivate"
                    value="false"
                    checked={!formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.value === "true" })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700">Public Server</div>
                    <div className="text-xs text-gray-500">
                      Visible in server browser, can be boosted, discoverable by everyone
                    </div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isPrivate"
                    value="true"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.value === "true" })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700">Private Server</div>
                    <div className="text-xs text-gray-500">
                      Hidden from server browser, no boost option, share with friends via direct link
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Minecraft Realm Toggle - only show for private Minecraft servers */}
            {formData.isPrivate && (formData.gameType === "Minecraft: Java Edition" || formData.gameType === "Minecraft: Bedrock Edition") && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRealm}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        isRealm: e.target.checked,
                        // Clear server IP if switching to realm
                        serverIp: e.target.checked ? "" : formData.serverIp,
                        serverPort: e.target.checked ? "" : formData.serverPort
                      })
                    }}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-amber-900">Is this a realm?</div>
                    <div className="text-xs text-amber-700 mt-0.5">
                      If so tick this box - realms do not use IP addresses, players join through realm invitations
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Server IP and Port - hide if it's a realm */}
            {!formData.isRealm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Address (for live stats)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    id="serverIp"
                    name="serverIp"
                    value={formData.serverIp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., play.myserver.com or 123.45.67.89"
                  />
                  <p className="text-xs text-gray-500 mt-1">Server IP or hostname</p>
                </div>
                <div>
                  <input
                    type="number"
                    id="serverPort"
                    name="serverPort"
                    value={formData.serverPort}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="25565"
                  />
                  <p className="text-xs text-gray-500 mt-1">Port</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional - Enables live player count and status. Leave blank to display IP only.
              </p>
            </div>
            )}

            {/* Tags */}
            {formData.gameType && availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Server Tags <span className="text-gray-500">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        formData.tags.includes(tag)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.tags.length > 0 ? formData.tags.join(", ") : "None"}
                </p>
              </div>
            )}

            {/* Monthly Cost */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Server Cost ({currency}) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">{symbol}</span>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  min="1"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={handleChange}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="30.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the cost in {getCurrencyName(currency)}.
                {currency !== 'USD' && formData.cost && (
                  <span className="text-indigo-600 font-medium">
                    {' '}(≈ ${convertToUSD(parseFloat(formData.cost || '0')).toFixed(2)} USD)
                  </span>
                )}
              </p>
            </div>

            {/* Withdrawal Day */}
            <div>
              <label htmlFor="withdrawalDay" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Collection Day
              </label>
              <select
                id="withdrawalDay"
                name="withdrawalDay"
                value={formData.withdrawalDay}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    Day {day} of each month
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When do you need the money? Pledgers will be charged 2 days before this date.
              </p>
            </div>

            {/* Server Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server Banner
              </label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                aspectRatio="500/100"
                acceptedTypes={["image/webp", "image/gif", "image/png"]}
                maxSize={2}
                placeholder="Upload server banner"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Upload a banner image (WEBP, GIF, or PNG, max 2MB, 500x100 recommended)
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Server"}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Monthly Pledges</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Players pledge $2-$30/month to support your server</li>
                <li>Smart optimization: When pledges exceed cost, everyone pays LESS!</li>
                <li>Automatic charging 2 days before your chosen date</li>
                <li>Platform takes 2% fee (Stripe fees separate)</li>
                <li>Money goes directly to your connected Stripe account</li>
                {currency !== 'USD' && (
                  <li className="font-medium">💱 Costs are automatically converted from {currency} to USD for storage</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

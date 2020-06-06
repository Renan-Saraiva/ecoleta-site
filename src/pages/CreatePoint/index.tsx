import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FiArrowLeft } from 'react-icons/fi'
import { Link, useHistory } from 'react-router-dom'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import axios from 'axios'

import './styles.css'
import logo from '../../assets/logo.svg'
import api from '../../services/api'

interface Items {
    id: number
    title: string
    image_url: string
}

interface IBGE_UF {
    sigla: string
}

interface IBGE_CIDADE {
    nome: string
}

const CreatePoint = () => {

    const [items, setItems] = useState<Items[]>([]);
    const [UFS, setUFS] = useState<string[]>([]);    
    const [citys, setCitys] = useState<string[]>([]);

    const [selectedUF, setSelectedUF] = useState<string>('0');
    const [selectedCity, setSelectedCity] = useState<string>('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);

    const [formData, setformData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const history = useHistory();

    useEffect(() => {        
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([position.coords.latitude, position.coords.longitude])
        })
    }, []);

    useEffect(() => {
        api.get('items').then(
            response => {
                setItems(response.data);
            }
        )
    }, []);
    
    useEffect(() => {
        axios.get<IBGE_UF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(
            response => {
                setUFS(response.data.map(uf => uf.sigla));
            }
        )
    }, []);

    function HandleSelectedUF(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUF(event.target.value);
    }

    function HandleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function HandleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    useEffect(() => {
        if (selectedUF !== '0') {
            axios.get<IBGE_CIDADE[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`).then(
                response => {
                    setCitys(response.data.map(uf => uf.nome));
                }
            )
        }
        else
            setCitys([]);
    }, [selectedUF]);

    function HandleInputChange(event: ChangeEvent<HTMLInputElement>) {
        setformData({...formData, [event.target.name]: event.target.value})
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id) >= 0;

        if (alreadySelected)
            setSelectedItems(selectedItems.filter(item => item !== id));
        else
            setSelectedItems([...selectedItems, id]);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        console.log('adsasdds');
        
        const data = {
            ...formData,
            uf: selectedUF,
            city: selectedCity,
            latitude: selectedPosition[0],
            longitude: selectedPosition[1],
            items: selectedItems
        };        

        await api.post('points', data);

        history.push('/')
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to='/'>
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do ponto <br /> de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={HandleInputChange}/>
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={HandleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Nome da entidade</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={HandleInputChange} />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map center={initialPosition} zoom={15} onClick={HandleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition} />
                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (uf)</label>
                            <select 
                                name="uf" 
                                id="email" 
                                value={selectedUF} 
                                onChange={HandleSelectedUF}>
                                <option value="0">Selecione um UF</option>
                                {
                                    UFS.map(UF => (
                                        <option key={UF} value={UF}>{UF}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city"
                                value={selectedCity} 
                                onChange={HandleSelectedCity}>
                                <option value="0">Selecione um Cidade</option>
                                {
                                    citys.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {
                            items.map(item => (
                                <li key={item.id} onClick={() => handleSelectItem(item.id)} className={selectedItems.includes(item.id) ? 'selected' : '' } >
                                    <img src={item.image_url} alt={item.title} />
                                    <span>{item.title}</span>
                                </li>
                            ))
                        }
                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint;

